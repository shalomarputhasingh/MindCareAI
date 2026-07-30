"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatLongDate } from "@/lib/date";
import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface JournalEditorProps {
  date: string;
  isToday: boolean;
  content: string;
  wordCount: number;
  status: SaveStatus;
  onChange: (value: string) => void;
  onBlur: () => void;
  onRetry: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  canGoNext: boolean;
  onJumpToday: () => void;
}

const STATUS_COPY: Record<SaveStatus, string> = {
  idle: "Up to date",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save",
};

export function JournalEditor({
  date,
  isToday,
  content,
  wordCount,
  status,
  onChange,
  onBlur,
  onRetry,
  onPrevDay,
  onNextDay,
  canGoNext,
  onJumpToday,
}: JournalEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous day"
            onClick={onPrevDay}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next day"
            disabled={!canGoNext}
            onClick={onNextDay}
          >
            <ChevronRight />
          </Button>
          <div className="ml-1.5">
            <p className="type-heading">{formatLongDate(date)}</p>
            {!isToday ? (
              <button
                type="button"
                onClick={onJumpToday}
                className="type-caption text-primary-strong text-xs underline-offset-2 hover:underline"
              >
                Jump to today
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            role="status"
            aria-live="polite"
            className={cn(
              "type-caption text-xs",
              status === "error" && "text-destructive",
              status === "saved" && "text-brand-strong",
            )}
          >
            {STATUS_COPY[status]}
          </span>
          {status === "error" ? (
            <Button type="button" size="xs" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>

      <Textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder="Start writing — today can be as small or as big as it was."
        aria-label={`Journal entry for ${formatLongDate(date)}`}
        className="type-body min-h-[26rem] resize-none border-none px-0 py-0 shadow-none focus-visible:ring-0"
      />

      <div className="border-border flex items-center justify-between border-t pt-3">
        <span className="type-caption tabular text-xs">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  );
}
