"use client";

import { Loader2, Mic, PhoneOff, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** What the person should understand is happening, right now. */
export type LivePhase =
  | "starting"
  | "listening"
  | "hearing"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "error";

const COPY: Record<LivePhase, { title: string; hint: string }> = {
  starting: { title: "Opening the microphone…", hint: "Allow access if your browser asks." },
  listening: { title: "Listening", hint: "Just start talking. Pause when you're done." },
  hearing: { title: "I can hear you", hint: "Keep going — I'll wait for a pause." },
  transcribing: { title: "Writing that down…", hint: "One moment." },
  thinking: { title: "Thinking…", hint: "Working out a reply." },
  speaking: { title: "Speaking", hint: "Talk over me any time to interrupt." },
  error: { title: "Something went wrong", hint: "You can close live mode and try again." },
};

interface LiveVoicePanelProps {
  phase: LivePhase;
  /** 0–1 microphone loudness, for the orb. */
  level: number;
  /** Live partial transcript, when the browser recogniser provides one. */
  partial: string;
  /** The last thing that was sent, so it's clear what was heard. */
  lastHeard: string | null;
  usesCloud: boolean;
  error: string | null;
  onEnd: () => void;
  onInterrupt: () => void;
}

/**
 * The hands-free surface. Replaces the composer while live mode is on.
 *
 * Deliberately one big target and one clear exit: this is used without looking
 * at the screen, and often on a phone lying on a table.
 */
export function LiveVoicePanel({
  phase,
  level,
  partial,
  lastHeard,
  usesCloud,
  error,
  onEnd,
  onInterrupt,
}: LiveVoicePanelProps) {
  const copy = COPY[phase];
  const open = phase === "listening" || phase === "hearing";
  // Only grow the orb from real sound, so a quiet room stays still.
  const scale = open ? 1 + Math.min(level, 1) * 0.35 : 1;

  return (
    <section
      aria-label="Live voice conversation"
      className="border-border bg-card shadow-soft rounded-2xl border p-4 sm:p-6"
    >
      <div className="flex flex-col items-center gap-3 text-center sm:gap-5">
        {/* ---------------------------- The orb ---------------------------- */}
        <div className="relative flex size-20 shrink-0 items-center justify-center sm:size-32">
          {open ? (
            <span
              aria-hidden
              className="bg-brand/20 absolute inset-0 rounded-full transition-transform duration-100 ease-out"
              style={{ transform: `scale(${scale})` }}
            />
          ) : null}
          {phase === "speaking" || phase === "thinking" ? (
            <span
              aria-hidden
              className="bg-primary/20 absolute inset-0 animate-ping rounded-full"
              style={{ animationDuration: "2s" }}
            />
          ) : null}

          <span
            aria-hidden
            className={cn(
              "relative flex size-14 items-center justify-center rounded-full transition-colors sm:size-24",
              phase === "speaking" || phase === "thinking"
                ? "bg-primary text-primary-foreground"
                : phase === "error"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-brand text-brand-foreground",
            )}
          >
            {phase === "transcribing" || phase === "starting" ? (
              <Loader2 className="size-6 animate-spin sm:size-8" />
            ) : phase === "speaking" ? (
              <Volume2 className="size-6 sm:size-8" />
            ) : phase === "thinking" ? (
              <span className="flex items-end gap-1">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="w-1.5 animate-bounce rounded-full bg-current"
                    style={{
                      height: "1.25rem",
                      animationDelay: `${index * 140}ms`,
                      animationDuration: "1s",
                    }}
                  />
                ))}
              </span>
            ) : (
              <Mic className="size-6 sm:size-8" />
            )}
          </span>
        </div>

        {/* --------------------------- What's going on --------------------- */}
        <div className="space-y-1" aria-live="polite">
          <p className="type-heading">{copy.title}</p>
          <p className="type-caption text-xs text-balance">{copy.hint}</p>
        </div>

        {/* --------------------------- What was heard ---------------------- */}
        <div className="min-h-[2.25rem] w-full max-w-prose sm:min-h-[3.25rem]">
          {partial ? (
            <p className="type-body text-muted-foreground text-sm text-pretty italic">
              {partial}
            </p>
          ) : lastHeard ? (
            <p className="type-caption text-xs text-pretty">
              <span className="text-foreground font-medium">Heard:</span> “{lastHeard}”
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-destructive text-xs text-pretty">
            {error}
          </p>
        ) : null}

        {/* ------------------------------ Controls ------------------------- */}
        <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          {phase === "speaking" ? (
            <Button type="button" variant="outline" size="lg" onClick={onInterrupt}>
              Skip
            </Button>
          ) : null}
          <Button type="button" variant="destructive" size="lg" onClick={onEnd}>
            <PhoneOff className="size-4" aria-hidden />
            End live chat
          </Button>
        </div>

        <p className="type-caption text-[11px] text-balance">
          {usesCloud
            ? "Your microphone is open, and each turn is uploaded to your AI provider to be transcribed."
            : "Your microphone is open, and your browser is doing the listening."}{" "}
          Replies send as soon as you pause — nothing is reviewed first.
        </p>
      </div>
    </section>
  );
}
