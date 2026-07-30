"use client";

import { ArrowUp, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    textareaRef.current?.focus();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="bg-card border-border shadow-soft flex items-end gap-2 rounded-xl border p-2"
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
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends; Shift+Enter is a newline. Don't hijack IME composition.
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        className="scrollbar-slim type-body max-h-[200px] min-h-0 resize-none border-0 bg-transparent py-2 shadow-none focus-visible:ring-0"
      />

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
  );
}
