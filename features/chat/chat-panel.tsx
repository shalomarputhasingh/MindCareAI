"use client";

import { MessageCircleHeart, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
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

import { ChatComposer } from "./chat-composer";
import { MessageBubble, TypingIndicator } from "./message-bubble";
import { SupportBanner } from "./support-banner";
import { useChat } from "./use-chat";
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
  const { supported: canSpeak, speaking, speak, stop: stopSpeaking } = useSpeech();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const spokenRef = useRef<string | null>(null);
  const lastAssistant = lastAssistantIndex === -1 ? null : chat.messages[lastAssistantIndex];
  const { voiceURI, rate, speakReplies } = settings.voice;

  const speakMessage = useCallback(
    (id: string, content: string) => {
      setSpeakingId(id);
      speak(content, { voiceURI, rate });
    },
    [speak, voiceURI, rate],
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
    if (!speakReplies || !canSpeak) return;
    if (!chat.loadedHistory || spokenRef.current === null) return;
    if (busy || !lastAssistant || lastAssistant.id === spokenRef.current) return;

    spokenRef.current = lastAssistant.id;

    // A synthetic voice reading a crisis response aloud can land badly. If the
    // support screen has tripped, the reply stays on the page only.
    if (chat.showSupport) return;

    speakMessage(lastAssistant.id, lastAssistant.content);
  }, [
    speakReplies,
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

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-dvh">
      <div className="border-border border-b px-5 py-4 sm:px-8">
        <PageHeader
          title="AI Chat"
          description="A private conversation that stays on this device."
          actions={
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="use-context"
                  checked={useContext}
                  onCheckedChange={setUseContext}
                />
                <Label htmlFor="use-context" className="type-caption text-xs font-normal">
                  Use today&apos;s notes
                </Label>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={!hasConversation}>
                    <Trash2 className="size-4" />
                    Clear
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
          }
        />
      </div>

      {/* ------------------------------ Messages ---------------------------- */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-slim flex-1 overflow-y-auto px-5 py-6 sm:px-8"
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
      <div className="border-border border-t px-5 py-4 sm:px-8">
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

          <ChatComposer
            onSend={(text) => void chat.send(text)}
            onStop={chat.stop}
            busy={busy}
            disabled={!isConfigured || !guestId}
          />

          <p className="type-caption text-center text-xs">
            MindCareAI is a wellbeing companion, not a therapist or emergency service.
          </p>
        </div>
      </div>
    </div>
  );
}
