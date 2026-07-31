"use client";

import { ArrowUp, Loader2, Mic, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

import { useVoiceInput } from "./use-voice-input";

interface ChatComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  busy: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_HEIGHT = 200;

export function ChatComposer({
  onSend,
  onStop,
  busy,
  disabled = false,
  placeholder = "What's on your mind?",
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [justDictated, setJustDictated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useSettings();

  const voice = useVoiceInput({
    provider: settings.provider,
    apiKey: settings.apiKey,
    model: settings.model,
    cloudEnabled: settings.voice.cloudInput,
    // Deliberately never auto-sends. A misheard word in an emotional
    // conversation is worse than a slower flow, so the transcript lands in the
    // box for the person to read and fix first.
    onTranscript: (text) => {
      setValue((current) => (current ? `${current.trimEnd()} ${text}` : text));
      setJustDictated(true);
      textareaRef.current?.focus();
    },
  });

  // Grow with the content up to a ceiling, then scroll inside.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text || busy || disabled) return;
    onSend(text);
    setValue("");
    setJustDictated(false);
    textareaRef.current?.focus();
  }

  const recording = voice.status === "recording";
  const transcribing = voice.status === "transcribing";

  return (
    <div className="space-y-2">
      {voice.error ? (
        <p
          role="alert"
          className="text-destructive flex items-start gap-2 px-1 text-xs"
        >
          <span className="flex-1">{voice.error}</span>
          <button
            type="button"
            onClick={voice.dismissError}
            className="shrink-0 underline underline-offset-2"
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          "bg-card border-border shadow-soft flex items-end gap-2 rounded-xl border p-2 transition-colors",
          recording && "border-destructive/60",
        )}
      >
        <label htmlFor="chat-input" className="sr-only">
          Message MindCareAI
        </label>
        <Textarea
          id="chat-input"
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={recording ? "Listening…" : placeholder}
          onChange={(event) => {
            setValue(event.target.value);
            setJustDictated(false);
          }}
          onKeyDown={(event) => {
            // Enter sends; Shift+Enter is a newline. Don't hijack IME composition.
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
          className="scrollbar-slim type-body max-h-[200px] min-h-0 resize-none border-0 bg-transparent py-2 shadow-none focus-visible:ring-0"
        />

        {voice.available && !busy ? (
          recording ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={voice.cancel}
                    aria-label="Discard recording"
                  >
                    <X className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Discard</TooltipContent>
              </Tooltip>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={voice.stop}
                aria-label="Stop recording"
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled || transcribing}
                  onClick={() => void voice.start()}
                  aria-label={transcribing ? "Transcribing" : "Dictate a message"}
                >
                  {transcribing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {transcribing
                  ? "Writing down what you said…"
                  : voice.mode === "cloud"
                    ? "Dictate — audio goes to your provider"
                    : "Dictate — handled by your browser"}
              </TooltipContent>
            </Tooltip>
          )
        ) : null}

        {busy ? (
          <Button type="button" size="icon" variant="secondary" onClick={onStop} aria-label="Stop replying">
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!value.trim() || disabled} aria-label="Send message">
            <ArrowUp className="size-4" />
          </Button>
        )}
      </form>

      {/* The recording indicator has to be impossible to miss — a mic that is
          live without the person knowing is the whole problem. */}
      {recording ? (
        <p
          aria-live="assertive"
          className="text-destructive flex items-center justify-center gap-2 text-xs font-medium"
        >
          <span aria-hidden className="bg-destructive size-2 animate-pulse rounded-full" />
          Recording
          {voice.mode === "cloud"
            ? " — this audio will be sent to your AI provider"
            : " — handled by your browser"}
        </p>
      ) : justDictated ? (
        <p aria-live="polite" className="type-caption text-center text-xs">
          Read it back before you send — dictation mishears things.
        </p>
      ) : null}
    </div>
  );
}
