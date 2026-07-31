"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { supportsTranscription } from "@/lib/ai/voice";
import { voiceApi } from "@/lib/api-client";
import type { Provider } from "@/types";

import {
  getRecognitionCtor,
  hasRecorderSupport,
  pickMimeType,
  type SpeechRecognitionLike,
} from "./speech-api";

export type VoiceInputStatus =
  | "unsupported"
  | "idle"
  | "recording"
  | "transcribing"
  | "error";

/** Where the audio goes. Surfaced in the UI so it is never a surprise. */
export type VoiceInputMode = "cloud" | "browser" | "none";

interface UseVoiceInputOptions {
  provider: Provider | null;
  apiKey: string;
  model: string;
  /** The user's opt-in to uploading audio for transcription. */
  cloudEnabled: boolean;
  /** Receives the finished transcript, for review before sending. */
  onTranscript: (text: string) => void;
}

/**
 * Push-to-talk dictation.
 *
 * Prefers the chosen provider's transcription when the user has opted in, and
 * otherwise falls back to the browser's own recogniser. Deliberately
 * push-to-talk rather than voice-activity detection: VAD false-triggers on
 * background noise, and a companion app that starts listening on its own is
 * exactly the wrong feeling.
 */
export function useVoiceInput({
  provider,
  apiKey,
  model,
  cloudEnabled,
  onTranscript,
}: UseVoiceInputOptions) {
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [browserAvailable, setBrowserAvailable] = useState(false);
  const [recorderAvailable, setRecorderAvailable] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Read inside async callbacks so a stale closure can't fire the wrong handler.
  const latest = useRef({ provider, apiKey, model, cloudEnabled, onTranscript });
  latest.current = { provider, apiKey, model, cloudEnabled, onTranscript };

  // Capability detection happens after mount — `window` isn't there on the server.
  useEffect(() => {
    setBrowserAvailable(getRecognitionCtor() !== null);
    setRecorderAvailable(hasRecorderSupport());
  }, []);

  const canUseCloud =
    cloudEnabled &&
    recorderAvailable &&
    provider !== null &&
    supportsTranscription(provider) &&
    Boolean(apiKey);

  const mode: VoiceInputMode = canUseCloud ? "cloud" : browserAvailable ? "browser" : "none";

  const releaseMicrophone = useCallback(() => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
  }, []);

  useEffect(
    () => () => {
      // Always drop the mic on unmount, or the browser keeps showing the
      // recording indicator after the user has navigated away.
      abortRef.current?.abort();
      recognitionRef.current?.abort();
      releaseMicrophone();
    },
    [releaseMicrophone],
  );

  const startCloud = useCallback(async () => {
    const mimeType = pickMimeType();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      releaseMicrophone();

      if (blob.size === 0) {
        setStatus("idle");
        return;
      }

      const { provider, apiKey, model, onTranscript } = latest.current;
      if (!provider) {
        setStatus("idle");
        return;
      }

      setStatus("transcribing");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const text = await voiceApi.transcribe(
          provider,
          apiKey,
          blob,
          model,
          controller.signal,
        );
        setStatus("idle");
        if (text) onTranscript(text);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          setStatus("idle");
          return;
        }
        setError(caught instanceof Error ? caught.message : "That didn't transcribe.");
        setStatus("error");
      } finally {
        abortRef.current = null;
      }
    };

    recorderRef.current = recorder;
    recorder.start();
    setStatus("recording");
  }, [releaseMicrophone]);

  const startBrowser = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    let collected = "";
    recognition.onresult = (event) => {
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) collected += result[0].transcript;
      }
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      if (event.error === "no-speech") {
        setStatus("idle");
        return;
      }
      setError(
        event.error === "not-allowed"
          ? "Your browser blocked microphone access. Allow it in the address bar, then try again."
          : "Dictation stopped unexpectedly. Try again.",
      );
      setStatus("error");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus((current) => (current === "error" ? current : "idle"));
      const text = collected.trim();
      if (text) latest.current.onTranscript(text);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus("recording");
  }, []);

  const start = useCallback(async () => {
    if (status === "recording" || status === "transcribing") return;
    setError(null);

    try {
      if (canUseCloud) {
        await startCloud();
      } else if (browserAvailable) {
        startBrowser();
      } else {
        setStatus("unsupported");
      }
    } catch (caught) {
      releaseMicrophone();
      const denied =
        caught instanceof DOMException &&
        (caught.name === "NotAllowedError" || caught.name === "SecurityError");
      setError(
        denied
          ? "Microphone access was blocked. Allow it in your browser, then try again."
          : "Couldn't start recording. Check that a microphone is connected.",
      );
      setStatus("error");
    }
  }, [status, canUseCloud, browserAvailable, startCloud, startBrowser, releaseMicrophone]);

  /** Ends the recording and begins transcription. */
  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  /** Throws the recording away without transcribing it. */
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    if (recorderRef.current) {
      chunksRef.current = [];
      if (recorderRef.current.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      releaseMicrophone();
    }
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setStatus("idle");
  }, [releaseMicrophone]);

  return {
    status,
    error,
    mode,
    available: mode !== "none",
    start,
    stop,
    cancel,
    dismissError: () => {
      setError(null);
      setStatus("idle");
    },
  };
}
