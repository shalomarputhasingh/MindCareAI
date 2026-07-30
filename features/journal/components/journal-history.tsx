"use client";

import { NotebookPen } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { formatLongDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { JournalRecord } from "@/lib/api-client";

import { excerpt } from "@/features/journal/lib/word-count";

interface JournalHistoryProps {
  entries: JournalRecord[] | null;
  error: boolean;
  selectedDate: string;
  onSelect: (date: string) => void;
}

/** Past entries, newest first. Selecting one opens it in the editor. */
export function JournalHistory({ entries, error, selectedDate, onSelect }: JournalHistoryProps) {
  if (error) {
    return <p className="type-caption">Couldn&rsquo;t load your past entries.</p>;
  }

  if (entries === null) {
    return <LoadingState rows={4} label="Loading past entries" />;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="Nothing written yet"
        description="Your entries will show up here once you write your first one."
      />
    );
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul className="scrollbar-slim max-h-[36rem] space-y-1 overflow-y-auto">
      {sorted.map((entry) => {
        const selected = entry.date === selectedDate;
        return (
          <li key={entry.date}>
            <button
              type="button"
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(entry.date)}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="type-heading text-sm">{formatLongDate(entry.date)}</p>
                <span className="type-caption tabular shrink-0 text-xs">
                  {entry.wordCount} {entry.wordCount === 1 ? "word" : "words"}
                </span>
              </div>
              {entry.content ? (
                <p className="type-caption mt-0.5 line-clamp-2 text-pretty">
                  {excerpt(entry.content)}
                </p>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
