"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { supportsTranscription } from "@/lib/ai/voice";
import { voiceApi } from "@/lib/api-client";
import { speechLangFor, transcriptionHintFor, type ChatLanguage } from "@/lib/language";
import type { Provider } from "@/types";

import { getRecognitionCtor, pickMimeType, type SpeechRecognitionLike } from "./speech-api";

/**
 * Hands-free conversation: the microphone stays open, the app works out when a
 * sentence has finished, and the transcript is sent without anyone touching the
 * keyboard.
 *
 * This is the mode push-to-talk deliberately isn't, so the trade-off is worth
 * naming: nothing is reviewed before it sends. That is the whole point of
 * hands-free, and it is why live mode is entered explicitly, shows every word
 * it heard, and can be stopped mid-sentence.
 *
 * The hook owns input only — listening, segmenting, transcribing. Sending the
 * text and speaking the answer belong to the panel, which is the only thing
 * that knows what the conversation is doing.
 */

/* ----------------------------- Tuning constants --------------------------- */

/** How often the level meter and the speech detector run. */
const FRAME_MS = 40;
/** Consecutive loud frames before we believe someone is actually talking. */
const ONSET_FRAMES = 3;
/** Quiet time that ends a sentence. Long enough to survive a thinking pause. */
const SILENCE_MS = 1_100;
/** Anything shorter is a cough, a chair, a door. */
const MIN_UTTERANCE_MS = 400;
/** Hard ceiling on one turn, so a stuck detector can't record forever. */
const MAX_UTTERANCE_MS = 30_000;
/** While waiting for someone to speak, recycle the recorder to bound memory. */
const IDLE_RECYCLE_MS = 12_000;
/** Absolute noise gate, on a -1..1 RMS scale. Below this is a quiet room. */
const FLOOR_RMS = 0.012;
/** Speech has to beat the measured room noise by this much. */
const SPEECH_OVER_NOISE = 2.2;
/**
 * Interrupting the assistant needs a clearly louder, longer sound. Echo
 * cancellation removes most of what the speakers put back into the mic, but
 * not all of it, and a reply cut off by its own voice is maddening.
 */
const BARGE_OVER_NOISE = 4;
const BARGE_FLOOR_RMS = 0.055;
const BARGE_FRAMES = 6;

export type LiveState =
  | "off"
  | "starting"
  | "listening"
  | "hearing"
  | "transcribing"
  | "paused"
  | "error";

interface UseLiveVoiceOptions {
  provider: Provider | null;
  apiKey: string;
  model: string;
  cloudEnabled: boolean;
  /** Which language to listen for. See `lib/language.ts`. */
  language: ChatLanguage;
  /** Called with each finished sentence. */
  onUtterance: (text: string) => void;
  /** Called when someone talks over the assistant, so playback can be cut. */
  onBargeIn?: () => void;
}

export function useLiveVoice({
  provider,
  apiKey,
  model,
  cloudEnabled,
  language,
  onUtterance,
  onBargeIn,
}: UseLiveVoiceOptions) {
  const [state, setState] = useState<LiveState>("off");
  const [level, setLevel] = useState(0);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // The detector's working memory. Kept in a ref because it changes 25 times a
  // second and none of it should cause a render.
  const vad = useRef({
    noiseFloor: FLOOR_RMS,
    loudFrames: 0,
    quietSince: 0,
    speaking: false,
    segmentStart: 0,
    recorderStart: 0,
    /** True while the assistant is talking: only barge-in is watched for. */
    listeningForBargeIn: false,
    /** True while the conversation is busy and nothing should be captured. */
    paused: false,
    /** Set once a turn has been handed over, to ignore the tail of that segment. */
    handedOver: false,
  });

  const latest = useRef({ provider, apiKey, model, language, onUtterance, onBargeIn });
  latest.current = { provider, apiKey, model, language, onUtterance, onBargeIn };

  const usesCloud =
    cloudEnabled &&
    provider !== null &&
    supportsTranscription(provider) &&
    Boolean(apiKey) &&
    typeof MediaRecorder !== "undefined";

  const usesCloudRef = useRef(usesCloud);
  usesCloudRef.current = usesCloud;

  /* ------------------------------- Teardown ------------------------------- */

  const teardown = useCallback(() => {
    if (frameTimerRef.current !== null) {
      window.clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;

    if (recorderRef.current) {
      recorderRef.current.ondataavailable = null;
      recorderRef.current.onstop = null;
      if (recorderRef.current.state !== "inactive") recorderRef.current.stop();
      recorderRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    analyserRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    setLevel(0);
    setPartial("");
  }, []);

  useEffect(() => teardown, [teardown]);

  /* ---------------------------- Cloud recording --------------------------- */

  /**
   * Starts a fresh recorder. Recording begins *before* anyone speaks, so the
   * first syllable — the one that trips the detector — is already captured.
   */
  const startSegment = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || !usesCloudRef.current) return;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = async () => {
      // `deliver` is set by the caller of stop() to say whether this segment
      // held speech or was just recycled ambient noise.
      const deliver = (recorder as MediaRecorder & { _deliver?: boolean })._deliver;
      if (!deliver || chunks.length === 0) return;

      const blob = new Blob(chunks, {
        type: recorder.mimeType || mimeType || "audio/webm",
      });
      if (blob.size === 0) return;

      const { provider, apiKey, model, language, onUtterance } = latest.current;
      if (!provider) return;

      setState("transcribing");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const text = await voiceApi.transcribe({
          provider,
          apiKey,
          audio: blob,
          model,
          language: transcriptionHintFor(language),
          signal: controller.signal,
        });
        if (text.trim()) onUtterance(text.trim());
        else setState((current) => (current === "transcribing" ? "listening" : current));
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(
          caught instanceof Error ? caught.message : "That didn't transcribe. Still listening.",
        );
        setState((current) => (current === "transcribing" ? "listening" : current));
      } finally {
        abortRef.current = null;
      }
    };

    recorderRef.current = recorder;
    vad.current.recorderStart = Date.now();
    recorder.start();
  }, []);

  const endSegment = useCallback(
    (deliver: boolean) => {
      const recorder = recorderRef.current;
      if (!recorder) return;
      (recorder as MediaRecorder & { _deliver?: boolean })._deliver = deliver;
      if (recorder.state !== "inactive") recorder.stop();
      recorderRef.current = null;
    },
    [],
  );

  /* -------------------------- The detector itself ------------------------- */

  const runFrame = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const buffer = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buffer);

    let sum = 0;
    for (let index = 0; index < buffer.length; index += 1) {
      const sample = (buffer[index] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / buffer.length);

    const memory = vad.current;
    const now = Date.now();

    // Track the quiet background so a noisy room raises the bar instead of
    // triggering constantly. Only adapt while nobody is talking.
    if (!memory.speaking) {
      memory.noiseFloor = memory.noiseFloor * 0.95 + Math.min(rms, 0.25) * 0.05;
    }

    // A 0–1 value for the visualiser, scaled against the current floor.
    const headroom = Math.max(rms - memory.noiseFloor, 0);
    setLevel(Math.min(1, headroom * 9));

    if (memory.listeningForBargeIn) {
      const loud =
        rms > Math.max(memory.noiseFloor * BARGE_OVER_NOISE, BARGE_FLOOR_RMS);
      memory.loudFrames = loud ? memory.loudFrames + 1 : 0;
      if (memory.loudFrames >= BARGE_FRAMES) {
        memory.loudFrames = 0;
        latest.current.onBargeIn?.();
      }
      return;
    }

    // Nothing is captured while the assistant has the floor.
    if (memory.paused) return;

    // With the browser recogniser the endpointing is its own; this loop is then
    // only the level meter and the barge-in watch above.
    if (!usesCloudRef.current) return;

    const threshold = Math.max(memory.noiseFloor * SPEECH_OVER_NOISE, FLOOR_RMS);
    const loud = rms > threshold;

    if (!memory.speaking) {
      memory.loudFrames = loud ? memory.loudFrames + 1 : 0;
      if (memory.loudFrames >= ONSET_FRAMES) {
        memory.speaking = true;
        memory.segmentStart = now - ONSET_FRAMES * FRAME_MS;
        memory.quietSince = 0;
        setState("hearing");
      } else if (
        usesCloudRef.current &&
        now - memory.recorderStart > IDLE_RECYCLE_MS
      ) {
        // Nothing said for a while — throw away the accumulated silence and
        // start a fresh buffer, still ahead of whatever comes next.
        endSegment(false);
        startSegment();
      }
      return;
    }

    // Speaking: wait for a long enough gap, then close the turn.
    if (loud) {
      memory.quietSince = 0;
    } else if (memory.quietSince === 0) {
      memory.quietSince = now;
    }

    const spokenFor = now - memory.segmentStart;
    const quietFor = memory.quietSince === 0 ? 0 : now - memory.quietSince;

    if (quietFor >= SILENCE_MS || spokenFor >= MAX_UTTERANCE_MS) {
      memory.speaking = false;
      memory.loudFrames = 0;
      memory.quietSince = 0;
      setLevel(0);

      const longEnough = spokenFor >= MIN_UTTERANCE_MS;
      if (usesCloudRef.current) {
        endSegment(longEnough);
        startSegment();
      }
      if (!longEnough) setState("listening");
    }
  }, [endSegment, startSegment]);

  /* ------------------------- Browser recogniser path ---------------------- */

  const startRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    // One language at a time, so "auto" can only mean the browser's locale.
    recognition.lang = speechLangFor(latest.current.language, navigator.language);
    // Not continuous: the browser's own endpointing closes the turn on silence,
    // which is exactly the segmentation live mode needs.
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalText = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      setPartial(finalText + interim);
      if (finalText || interim) setState("hearing");
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser, then start live mode again."
          : "Dictation stopped unexpectedly.",
      );
      setState("error");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setPartial("");
      const text = finalText.trim();
      if (text) {
        latest.current.onUtterance(text);
        return;
      }
      // Nothing heard — go straight back to listening.
      setState((current) => {
        if (current === "off" || current === "error" || current === "paused") return current;
        window.setTimeout(() => {
          if (recognitionRef.current === null) startRecognition();
        }, 120);
        return "listening";
      });
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setState("listening");
    } catch {
      // Already running; the existing session keeps the loop alive.
    }
  }, []);

  /* --------------------------------- Start -------------------------------- */

  const start = useCallback(async () => {
    setError(null);
    setState("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Echo cancellation is what makes barge-in possible at all: without
          // it the microphone hears the reply being spoken and interrupts it.
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioContextCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextCtor) {
        const context = new AudioContextCtor();
        // Safari hands back a suspended context even inside a click handler.
        if (context.state === "suspended") await context.resume().catch(() => undefined);
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.4;
        context.createMediaStreamSource(stream).connect(analyser);
        audioContextRef.current = context;
        analyserRef.current = analyser;
      }

      Object.assign(vad.current, {
        noiseFloor: FLOOR_RMS,
        loudFrames: 0,
        quietSince: 0,
        speaking: false,
        segmentStart: 0,
        recorderStart: Date.now(),
        listeningForBargeIn: false,
        paused: false,
      });

      // One loop drives everything: the level meter always, segmentation on the
      // cloud path, and the barge-in watch in both. An interval rather than
      // requestAnimationFrame, which stops entirely in a background tab.
      frameTimerRef.current = window.setInterval(runFrame, FRAME_MS);

      if (usesCloudRef.current) {
        startSegment();
        setState("listening");
      } else {
        startRecognition();
      }
    } catch (caught) {
      teardown();
      const denied =
        caught instanceof DOMException &&
        (caught.name === "NotAllowedError" || caught.name === "SecurityError");
      setError(
        denied
          ? "Microphone access was blocked. Allow it in your browser, then start live mode again."
          : "Couldn't open the microphone. Check that one is connected.",
      );
      setState("error");
    }
  }, [runFrame, startSegment, startRecognition, teardown]);

  const stop = useCallback(() => {
    teardown();
    setState("off");
    setError(null);
  }, [teardown]);

  /**
   * Stops listening without giving up the microphone — used while the
   * assistant is thinking or talking, so its own voice is never transcribed.
   * `watchForBargeIn` keeps the detector running at a much higher bar so
   * someone can talk over the reply.
   */
  const pause = useCallback(
    (watchForBargeIn = false) => {
      const memory = vad.current;
      memory.speaking = false;
      memory.loudFrames = 0;
      memory.quietSince = 0;
      memory.listeningForBargeIn = watchForBargeIn;
      memory.paused = true;

      if (usesCloudRef.current) endSegment(false);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setPartial("");
      setLevel(0);
      setState("paused");
    },
    [endSegment],
  );

  const resume = useCallback(() => {
    if (!streamRef.current) return;
    const memory = vad.current;
    memory.speaking = false;
    memory.loudFrames = 0;
    memory.quietSince = 0;
    memory.listeningForBargeIn = false;
    memory.paused = false;
    memory.recorderStart = Date.now();

    if (usesCloudRef.current) startSegment();
    else startRecognition();
    setState("listening");
  }, [startSegment, startRecognition]);

  return {
    state,
    level,
    partial,
    error,
    /** True when audio is being uploaded rather than handled in the browser. */
    usesCloud,
    start,
    stop,
    pause,
    resume,
    dismissError: () => setError(null),
  };
}
