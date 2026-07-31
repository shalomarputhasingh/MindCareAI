"use client";

import { MessageCircleHeart, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGuestId } from "@/hooks/use-guest-id";
import { useSettings } from "@/hooks/use-settings";
import { describeSpeechLang, speechLangFor, spokenLangFor } from "@/lib/language";

import { ChatComposer } from "./chat-composer";
import { LiveVoicePanel, type LivePhase } from "./live-voice-panel";
import { MessageBubble, TypingIndicator } from "./message-bubble";
import { SupportBanner } from "./support-banner";
import { useChat } from "./use-chat";
import { useLiveVoice } from "./use-live-voice";
import { useSpeech } from "./use-speech";

const OPENERS = [
  "I've had a long day and I'm not sure why it got to me.",
  "Something good happened today and I want to tell someone.",
  "I keep putting off something and I don't know why.",
  "I'm feeling flat and I can't put my finger on it.",
];

export function ChatPanel() {
  const guestId = useGuestId();
  const { settings, isConfigured, hydrated } = useSettings();
  const [useContext, setUseContext] = useState(true);
  const [liveOn, setLiveOn] = useState(false);
  // Read defensively: this component renders on the server for the first paint.
  const browserLocale = typeof navigator === "undefined" ? "" : navigator.language;

  const chat = useChat({ guestId, settings, useContext });

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  // Only auto-scroll when the person is already at the bottom, so reading back
  // through the conversation isn't yanked away mid-sentence.
  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    pinnedToBottom.current = distance < 120;
  }, []);

  useEffect(() => {
    if (pinnedToBottom.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [chat.messages, chat.streamingText, chat.status]);

  const busy = chat.status !== "idle";
  const hasConversation = chat.messages.length > 0;
  const lastAssistantIndex = chat.messages.findLastIndex(
    (message) => message.role === "assistant",
  );

  /* ------------------------------- Read aloud ------------------------------ */

  // Destructured because `useSpeech` returns a fresh object each render — the
  // individual callbacks are stable, the object is not.
  const {
    supported: canSpeak,
    speaking,
    spokenAs,
    speak,
    stop: stopSpeaking,
  } = useSpeech();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const spokenRef = useRef<string | null>(null);
  const lastAssistant = lastAssistantIndex === -1 ? null : chat.messages[lastAssistantIndex];
  const { voiceURI, rate, speakReplies } = settings.voice;
  // Live mode is a spoken conversation, so replies are always read back — the
  // settings toggle only governs typed chat.
  const shouldSpeakReplies = speakReplies || liveOn;

  const speakMessage = useCallback(
    (id: string, content: string) => {
      setSpeakingId(id);
      // The reply's own script decides the voice. In "auto" it is the only
      // evidence available, and even on a fixed setting a model sometimes
      // answers in the other language — following the text keeps it audible.
      speak(content, {
        voiceURI,
        rate,
        lang: spokenLangFor(settings.language, content, browserLocale),
      });
    },
    [speak, voiceURI, rate, settings.language, browserLocale],
  );

  // Never leave a stale highlight once the utterance ends on its own.
  useEffect(() => {
    if (!speaking) setSpeakingId(null);
  }, [speaking]);

  // Stored history is marked as already-heard, so opening the page doesn't
  // start reading yesterday's conversation out loud.
  useEffect(() => {
    if (chat.loadedHistory && spokenRef.current === null) {
      spokenRef.current = lastAssistant?.id ?? "";
    }
  }, [chat.loadedHistory, lastAssistant?.id]);

  useEffect(() => {
    if (!shouldSpeakReplies || !canSpeak) return;
    if (!chat.loadedHistory || spokenRef.current === null) return;
    if (busy || !lastAssistant || lastAssistant.id === spokenRef.current) return;

    spokenRef.current = lastAssistant.id;

    // A synthetic voice reading a crisis response aloud can land badly. If the
    // support screen has tripped, the reply stays on the page only.
    if (chat.showSupport) return;

    speakMessage(lastAssistant.id, lastAssistant.content);
  }, [
    shouldSpeakReplies,
    canSpeak,
    chat.loadedHistory,
    chat.showSupport,
    busy,
    lastAssistant,
    speakMessage,
  ]);

  // Silence anything in flight when the conversation is cleared.
  useEffect(() => {
    if (!hasConversation) {
      spokenRef.current = chat.loadedHistory ? "" : null;
      stopSpeaking();
    }
  }, [hasConversation, chat.loadedHistory, stopSpeaking]);

  /* ------------------------------- Live mode ------------------------------- */

  const [lastHeard, setLastHeard] = useState<string | null>(null);
  // A turn transcribed while the previous reply is still arriving would be
  // dropped by `send`, so it waits here instead of being lost.
  const pendingRef = useRef<string | null>(null);

  const live = useLiveVoice({
    provider: settings.provider,
    apiKey: settings.apiKey,
    model: settings.model,
    cloudEnabled: settings.voice.cloudInput,
    language: settings.language,
    onUtterance: (text) => {
      setLastHeard(text);
      pendingRef.current = text;
    },
    onBargeIn: stopSpeaking,
  });

  const { start: startLive, stop: stopLive, pause: pauseLive, resume: resumeLive } = live;

  // What we last asked the microphone to do, so the effect below doesn't
  // re-issue the same instruction on every render.
  const liveIntent = useRef<"off" | "listen" | "pause" | "barge">("off");

  useEffect(() => {
    if (!liveOn) {
      liveIntent.current = "off";
      return;
    }
    const want = busy ? "pause" : speaking ? "barge" : "listen";
    if (want === liveIntent.current) return;
    liveIntent.current = want;

    if (want === "pause") pauseLive(false);
    // Keep the detector running at a much higher bar while the reply plays, so
    // it can be talked over.
    else if (want === "barge") pauseLive(true);
    else resumeLive();
  }, [liveOn, busy, speaking, pauseLive, resumeLive]);

  // Flush a queued turn the moment the conversation is free again.
  useEffect(() => {
    if (!liveOn || busy || !pendingRef.current) return;
    const text = pendingRef.current;
    pendingRef.current = null;
    void chat.send(text);
  }, [liveOn, busy, chat]);

  async function toggleLive() {
    if (liveOn) {
      setLiveOn(false);
      liveIntent.current = "off";
      pendingRef.current = null;
      stopLive();
      stopSpeaking();
      return;
    }
    setLastHeard(null);
    setLiveOn(true);
    liveIntent.current = "listen";
    await startLive();
  }

  const livePhase: LivePhase =
    live.state === "error"
      ? "error"
      : speaking
        ? "speaking"
        : busy
          ? "thinking"
          : live.state === "transcribing"
            ? "transcribing"
            : live.state === "hearing"
              ? "hearing"
              : live.state === "starting"
                ? "starting"
                : "listening";

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-dvh">
      {/* A compact single row on a phone: the full stacked header ate 169px of
          a 568px screen, which pushed the live-mode controls off the bottom. */}
      <div className="border-border shrink-0 border-b px-4 py-3 sm:px-8 sm:py-4">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 space-y-1.5">
            <h1 className="type-title text-balance">AI Chat</h1>
            <p className="type-caption hidden max-w-prose text-pretty sm:block">
              A private conversation that stays on this device.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="use-context"
                checked={useContext}
                onCheckedChange={setUseContext}
              />
              <Label htmlFor="use-context" className="type-caption text-xs font-normal">
                <span className="sm:hidden">Notes</span>
                <span className="hidden sm:inline">Use today&apos;s notes</span>
              </Label>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={!hasConversation}>
                  <Trash2 className="size-4" />
                  <span className="hidden xs:inline">Clear</span>
                </Button>
              </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear this conversation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The messages are deleted from this device. Your journal, moods and
                      habits stay exactly as they are.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void chat.clear()}>
                      Clear conversation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
      </div>

      {/* ------------------------------ Messages ---------------------------- */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        // `min-h-0` so this can actually shrink: without it the transcript area
        // refuses to give ground and pushes the composer off the bottom of a
        // short screen.
        className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6"
      >
        <div className="mx-auto w-full max-w-4xl space-y-5">
          {!hasConversation && chat.loadedHistory && !busy ? (
            <div className="animate-rise space-y-6 py-8">
              <div className="space-y-2 text-center">
                <span
                  aria-hidden
                  className="bg-brand-muted text-brand-strong mx-auto flex size-12 items-center justify-center rounded-full"
                >
                  <MessageCircleHeart className="size-5" />
                </span>
                <h2 className="type-title">What&apos;s on your mind?</h2>
                <p className="type-caption mx-auto max-w-md text-pretty">
                  Start wherever you like. There&apos;s no right way in, and nothing you
                  write leaves this device.
                </p>
              </div>

              <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
                {OPENERS.map((opener) => (
                  <button
                    key={opener}
                    type="button"
                    onClick={() => void chat.send(opener)}
                    disabled={!isConfigured}
                    className="surface hover:border-primary/40 type-body text-muted-foreground hover:text-foreground p-3.5 text-left text-sm transition-colors disabled:opacity-50"
                  >
                    {opener}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {chat.messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              canRegenerate={index === lastAssistantIndex && !busy}
              onRegenerate={() => void chat.regenerate()}
              canSpeak={canSpeak}
              isSpeaking={speaking && speakingId === message.id}
              onSpeak={() => speakMessage(message.id, message.content)}
              onStopSpeaking={stopSpeaking}
            />
          ))}

          {chat.status === "loading" ? <TypingIndicator /> : null}

          {chat.status === "streaming" && chat.streamingText ? (
            <MessageBubble
              message={{
                id: "streaming",
                role: "assistant",
                content: chat.streamingText,
                createdAt: new Date().toISOString(),
              }}
            />
          ) : null}

          {chat.showSupport ? <SupportBanner onDismiss={chat.dismissSupport} /> : null}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ------------------------------ Composer ---------------------------- */}
      <div className="border-border shrink-0 border-t px-4 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto w-full max-w-4xl space-y-2.5">
          {chat.error ? (
            <div
              role="alert"
              className="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm"
            >
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span className="flex-1">{chat.error}</span>
              <button
                type="button"
                onClick={chat.dismissError}
                className="shrink-0 underline underline-offset-2"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {hydrated && !isConfigured ? (
            <p className="type-caption flex items-center gap-2 text-xs">
              <Sparkles aria-hidden className="size-3.5" />
              Add a provider and API key in Settings to start chatting.
            </p>
          ) : null}

          {liveOn ? (
            <LiveVoicePanel
              phase={livePhase}
              level={live.level}
              partial={live.partial}
              lastHeard={lastHeard}
              usesCloud={live.usesCloud}
              listeningLanguage={describeSpeechLang(
                speechLangFor(settings.language, browserLocale),
              )}
              error={live.error}
              onEnd={() => void toggleLive()}
              onInterrupt={stopSpeaking}
            />
          ) : (
            <ChatComposer
              onSend={(text) => void chat.send(text)}
              onStop={chat.stop}
              busy={busy}
              disabled={!isConfigured || !guestId}
              onStartLive={() => void toggleLive()}
            />
          )}

          {/* Owning up beats sounding broken. Without this the fallback reads as
              a terrible Tamil voice rather than a missing one. */}
          {spokenAs?.romanised ? (
            <p className="type-caption text-center text-xs">
              No Tamil voice on this device, so Tamil is being read with an English one.{" "}
              <Link href="/app/settings" className="underline underline-offset-2">
                Settings
              </Link>{" "}
              explains how to add a proper one.
            </p>
          ) : null}

          <p className="type-caption text-center text-xs">
            MindCareAI is a wellbeing companion, not a therapist or emergency service.
          </p>
        </div>
      </div>
    </div>
  );
}
