"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    (text: string, options?: { voiceURI?: string; rate?: number }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      const spoken = toSpokenText(text);
      if (!spoken) return;

      // Only one thing talks at a time; a new reply replaces the last.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(spoken);
      utterance.rate = options?.rate ?? 0.95;

      if (options?.voiceURI) {
        const match = window.speechSynthesis
          .getVoices()
          .find((voice) => voice.voiceURI === options.voiceURI);
        if (match) utterance.voice = match;
      }

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
