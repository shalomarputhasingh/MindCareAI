"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { chatApi, type ChatRecord } from "@/lib/api-client";
import type { AppSettings, ChatMessage } from "@/types";

type Status = "idle" | "loading" | "streaming";

interface UseChatOptions {
  guestId: string | null;
  settings: AppSettings;
  /** Let the model see today's mood, journal and habits. */
  useContext: boolean;
}

/**
 * Owns the whole conversation: local history, streaming, persistence and
 * regeneration. The UI is a pure function of what this returns.
 */
export function useChat({ guestId, settings, useContext }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [loadedHistory, setLoadedHistory] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Load the stored conversation once the guest id is known.
  useEffect(() => {
    if (!guestId) return;
    let cancelled = false;

    chatApi
      .history(guestId)
      .then((records: ChatRecord[]) => {
        if (cancelled) return;
        setMessages(
          records.map((record) => ({
            id: record.id,
            role: record.role,
            content: record.content,
            createdAt: record.createdAt,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your earlier messages.");
      })
      .finally(() => {
        if (!cancelled) setLoadedHistory(true);
      });

    return () => {
      cancelled = true;
    };
  }, [guestId]);

  // Drop any in-flight request if the component goes away.
  useEffect(() => () => abortRef.current?.abort(), []);

  /**
   * Streams a reply for `history`. Shared by send and regenerate so the two
   * can't drift apart.
   */
  const streamReply = useCallback(
    async (history: ChatMessage[]) => {
      if (!guestId) return;

      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("loading");
      setError(null);
      setStreamingText("");
      setShowSupport(false);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            guestId,
            useContext,
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "The AI provider didn't respond.");
        }

        if (response.headers.get("X-MindCare-Support") === "1") {
          setShowSupport(true);
        }

        setStatus("streaming");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setStreamingText(full);
        }
        full += decoder.decode();

        if (!full.trim()) {
          throw new Error("The model returned an empty reply. Try again.");
        }

        // Persist first so a refresh can't lose the reply, then move it out of
        // the streaming slot into the message list.
        const saved = await chatApi
          .append(guestId, "assistant", full)
          .catch(() => null);

        setMessages((current) => [
          ...current,
          {
            id: saved?.id ?? `local-${Date.now()}`,
            role: "assistant",
            content: full,
            createdAt: saved?.createdAt ?? new Date().toISOString(),
          },
        ]);
      } catch (caught) {
        // An abort is the user stopping the reply, not a failure.
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      } finally {
        setStreamingText("");
        setStatus("idle");
        abortRef.current = null;
      }
    },
    [guestId, settings, useContext],
  );

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || !guestId || status !== "idle") return;

      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      const next = [...messages, optimistic];
      setMessages(next);

      // Fire and forget: a failed write to local history shouldn't stop the reply.
      chatApi.append(guestId, "user", content).catch(() => undefined);

      await streamReply(next);
    },
    [guestId, messages, status, streamReply],
  );

  /** Re-asks the last question, replacing the previous answer. */
  const regenerate = useCallback(async () => {
    if (!guestId || status !== "idle") return;

    const lastUserIndex = messages.findLastIndex((message) => message.role === "user");
    if (lastUserIndex === -1) return;

    const history = messages.slice(0, lastUserIndex + 1);
    setMessages(history);
    await streamReply(history);
  }, [guestId, messages, status, streamReply]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const clear = useCallback(async () => {
    if (!guestId) return;
    abortRef.current?.abort();
    setMessages([]);
    setStreamingText("");
    setError(null);
    setShowSupport(false);
    await chatApi.clear(guestId).catch(() => undefined);
  }, [guestId]);

  return {
    messages,
    streamingText,
    status,
    error,
    showSupport,
    loadedHistory,
    send,
    regenerate,
    stop,
    clear,
    dismissError: () => setError(null),
    dismissSupport: () => setShowSupport(false),
  };
}
