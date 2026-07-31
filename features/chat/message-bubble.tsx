"use client";

import { Check, Copy, RotateCcw, Square, Volume2 } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

import { MarkdownMessage } from "./markdown-message";

interface MessageBubbleProps {
  message: ChatMessage;
  /** Shown only on the newest assistant message. */
  canRegenerate?: boolean;
  onRegenerate?: () => void;
  /**
   * Read-aloud wiring. Owned by the panel rather than the bubble so one
   * utterance is in flight at a time and history isn't re-read on mount.
   */
  canSpeak?: boolean;
  isSpeaking?: boolean;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
}

export function MessageBubble({
  message,
  canRegenerate = false,
  onRegenerate,
  canSpeak = false,
  isSpeaking = false,
  onSpeak,
  onStopSpeaking,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable; don't pretend it worked.
    }
  }

  return (
    <div
      className={cn("group flex gap-3", isUser ? "justify-end" : "justify-start")}
      data-role={message.role}
    >
      {!isUser ? (
        <span className="mt-1 shrink-0">
          <BrandMark showName={false} />
        </span>
      ) : null}

      <div className={cn("min-w-0 max-w-[min(46rem,88%)] space-y-1.5")}>
        <div
          className={cn(
            "rounded-xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-card border-border shadow-soft rounded-bl-sm border",
          )}
        >
          {isUser ? (
            // User text is shown verbatim — no markdown parsing of their words.
            <p className="type-body whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100",
            isUser && "justify-end",
            // Keep the stop control reachable while the reply is being read out.
            isSpeaking && "opacity-100",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={copy}
                aria-label={copied ? "Message copied" : "Copy message"}
              >
                {copied ? (
                  <Check className="text-brand-strong size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied" : "Copy message"}</TooltipContent>
          </Tooltip>

          {canSpeak && !isUser ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={isSpeaking ? onStopSpeaking : onSpeak}
                  aria-label={isSpeaking ? "Stop reading aloud" : "Read this aloud"}
                >
                  {isSpeaking ? (
                    <Square className="text-brand-strong size-3 fill-current" />
                  ) : (
                    <Volume2 className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isSpeaking ? "Stop" : "Read aloud"}</TooltipContent>
            </Tooltip>
          ) : null}

          {canRegenerate && onRegenerate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onRegenerate}
                  aria-label="Regenerate this reply"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Try a different reply</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The three-dot wait state, shown before the first token arrives. */
export function TypingIndicator() {
  return (
    <div className="flex gap-3" aria-live="polite">
      <span className="mt-1 shrink-0">
        <BrandMark showName={false} />
      </span>
      <div className="bg-card border-border shadow-soft flex items-center gap-1.5 rounded-xl rounded-bl-sm border px-4 py-4">
        <span className="sr-only">MindCareAI is replying</span>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            aria-hidden
            className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
            style={{ animationDelay: `${index * 140}ms`, animationDuration: "1s" }}
          />
        ))}
      </div>
    </div>
  );
}
