"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MOOD_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MoodScore } from "@/types";

interface MoodPickerProps {
  /** The score and note already saved for this day, if any. */
  initialScore: MoodScore | null;
  initialNote: string;
  saving: boolean;
  onSave: (score: MoodScore, note: string) => void;
}

/**
 * The five-way mood chooser plus an optional note and a save action. Loads
 * whatever was already saved for the day as the current selection, so a
 * second save that day reads as an edit rather than a new entry.
 */
export function MoodPicker({ initialScore, initialNote, saving, onSave }: MoodPickerProps) {
  const [score, setScore] = useState<MoodScore | null>(initialScore);
  const [note, setNote] = useState(initialNote);
  const noteId = useId();

  // The parent only knows the saved values once the network call resolves,
  // so sync in from props whenever the day being edited changes underneath us.
  useEffect(() => {
    setScore(initialScore);
    setNote(initialNote);
  }, [initialScore, initialNote]);

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Choose your mood" className="flex flex-wrap gap-2 sm:gap-3">
        {MOOD_OPTIONS.map((option) => {
          const selected = score === option.score;
          return (
            <button
              key={option.score}
              type="button"
              aria-pressed={selected}
              onClick={() => setScore(option.score)}
              className={cn(
                "flex min-h-[6.5rem] min-w-[4.75rem] flex-1 basis-20 flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 transition-colors",
                "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                selected
                  ? "border-primary bg-primary/10 shadow-soft"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              <span className="text-3xl" aria-hidden>
                {option.emoji}
              </span>
              <span
                className={cn(
                  "type-caption text-xs font-medium",
                  selected && "text-primary-strong",
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label htmlFor={noteId} className="type-caption block text-xs font-medium">
          Add a note (optional)
        </label>
        <Textarea
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What's behind today's mood?"
          rows={3}
          className="type-body resize-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="xl"
          disabled={score === null || saving}
          onClick={() => score !== null && onSave(score, note.trim())}
        >
          {saving
            ? "Saving…"
            : initialScore !== null
              ? "Update today's check-in"
              : "Save today's check-in"}
        </Button>
        {score === null ? (
          <p className="type-caption">Choose a mood to save today&rsquo;s check-in.</p>
        ) : null}
      </div>
    </div>
  );
}
