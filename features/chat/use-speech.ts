"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { primarySubtag } from "@/lib/language";

/**
 * Reads text aloud with the browser's own speech synthesis.
 *
 * On-device by design: OS voices need no network and no key, so replies can be
 * spoken without any of the user's words leaving the machine. That keeps voice
 * output consistent with the promise the rest of the app makes.
 */

/** Markdown is for the eye. Strip it before anything is spoken. */
export function toSpokenText(markdown: string): string {
  return (
    markdown
      // Fenced code is unlistenable — name it instead of reading it out.
      .replace(/```[\s\S]*?```/g, " (code block) ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/\|/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Which voice reads a given reply.
 *
 * The saved preference wins, but only when it can actually pronounce what it
 * has been handed. A Tamil reply read by an English voice is not merely
 * accented — the engine has no mapping for Tamil script and produces silence or
 * a spelled-out mess, which is a bad thing to do to someone who has just
 * written something difficult. So a language mismatch demotes the preference
 * and the best-matching installed voice is used instead.
 */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  voiceURI?: string,
  lang?: string,
): SpeechSynthesisVoice | null {
  const preferred = voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : undefined;
  if (!lang) return preferred ?? null;

  const wanted = primarySubtag(lang);
  if (preferred && primarySubtag(preferred.lang) === wanted) return preferred;

  // Anything reaching here has a preference that cannot read this text.
  const matching = voices.filter((v) => primarySubtag(v.lang) === wanted);
  if (matching.length === 0) {
    // Nothing installed for this language either. Leaving the voice unset lets
    // the engine choose from `utterance.lang`, which may still find something;
    // forcing the mismatched preference guarantees it cannot.
    return null;
  }

  // Exact region first (ta-IN over ta-LK), then on-device over network voices.
  const exact = matching.filter(
    (v) => v.lang.toLowerCase().replace("_", "-") === lang.toLowerCase(),
  );
  const pool = exact.length > 0 ? exact : matching;
  return pool.find((v) => v.localService) ?? pool[0];
}

/** True when the device has any voice that can read this language. */
export function hasVoiceFor(voices: SpeechSynthesisVoice[], lang: string): boolean {
  const wanted = primarySubtag(lang);
  return voices.some((voice) => primarySubtag(voice.lang) === wanted);
}

export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    // Voices load asynchronously in most browsers, and the first read is often
    // an empty list.
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, options?: { voiceURI?: string; rate?: number; lang?: string }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      const spoken = toSpokenText(text);
      if (!spoken) return;

      // Only one thing talks at a time; a new reply replaces the last.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(spoken);
      utterance.rate = options?.rate ?? 0.95;
      if (options?.lang) utterance.lang = options.lang;

      const voice = pickVoice(
        window.speechSynthesis.getVoices(),
        options?.voiceURI,
        options?.lang,
      );
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        utteranceRef.current = null;
        setSpeaking(false);
      };
      utterance.onerror = () => {
        utteranceRef.current = null;
        setSpeaking(false);
      };

      utteranceRef.current = utterance;
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [],
  );

  return { supported, speaking, voices, speak, stop };
}
