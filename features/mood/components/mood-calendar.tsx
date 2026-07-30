"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MOOD_OPTIONS } from "@/lib/constants";
import { formatLongDate, toDayKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { MoodRecord } from "@/lib/api-client";

import { DayCell } from "@/features/mood/components/day-cell";
import { moodTint } from "@/features/mood/lib/mood-color";

const LABEL_BY_SCORE = new Map(MOOD_OPTIONS.map((option) => [option.score, option.label]));
const EMOJI_BY_SCORE = new Map(MOOD_OPTIONS.map((option) => [option.score, option.emoji]));

const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, index) =>
  new Date(1970, 0, 4 + index).toLocaleDateString(undefined, { weekday: "short" }),
);

interface MoodCalendarProps {
  entries: Map<string, MoodRecord>;
}

/** Month view of check-ins, each logged day tinted by how the day was rated. */
export function MoodCalendar({ entries }: MoodCalendarProps) {
  const todayKey = toDayKey();
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  const firstOfMonth = new Date(cursor.year, cursor.month, 1);
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      toDayKey(new Date(cursor.year, cursor.month, index + 1)),
    ),
  ];

  const monthLabel = firstOfMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="type-heading">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() =>
              setCursor(({ year, month }) => {
                const next = new Date(year, month - 1, 1);
                return { year: next.getFullYear(), month: next.getMonth() };
              })
            }
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            disabled={isCurrentMonth}
            onClick={() =>
              setCursor(({ year, month }) => {
                const next = new Date(year, month + 1, 1);
                return { year: next.getFullYear(), month: next.getMonth() };
              })
            }
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="type-caption text-center text-[11px] font-medium">
            {label}
          </div>
        ))}
        {cells.map((dayKey, index) => {
          if (!dayKey) return <div key={`blank-${index}`} aria-hidden />;

          const entry = entries.get(dayKey);
          const dayNumber = Number(dayKey.slice(-2));
          const isToday = dayKey === todayKey;
          const label = entry
            ? `${formatLongDate(dayKey)} — ${LABEL_BY_SCORE.get(entry.score)}`
            : formatLongDate(dayKey);

          if (!entry) {
            return (
              <div key={dayKey} className="flex items-center justify-center">
                <DayCell label={label} current={isToday} className="bg-muted/60 text-muted-foreground">
                  {dayNumber}
                </DayCell>
              </div>
            );
          }

          return (
            <Popover key={dayKey}>
              <div className="flex items-center justify-center">
                <PopoverTrigger asChild>
                  <DayCell
                    label={label}
                    current={isToday}
                    interactive
                    className={cn(moodTint(entry.score), "text-foreground")}
                  >
                    {dayNumber}
                  </DayCell>
                </PopoverTrigger>
              </div>
              <PopoverContent className="w-64 space-y-1.5">
                <p className="type-heading text-sm">{formatLongDate(dayKey)}</p>
                <p className="text-sm">
                  <span aria-hidden>{EMOJI_BY_SCORE.get(entry.score)}</span>{" "}
                  {LABEL_BY_SCORE.get(entry.score)}
                </p>
                {entry.note ? (
                  <p className="type-caption text-pretty">{entry.note}</p>
                ) : (
                  <p className="type-caption">No note added.</p>
                )}
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <span className="type-caption text-xs">Struggling</span>
        <div className="flex items-center gap-1">
          {MOOD_OPTIONS.slice()
            .reverse()
            .map((option) => (
              <span
                key={option.score}
                aria-hidden
                className={cn("size-3 rounded-sm", moodTint(option.score))}
              />
            ))}
        </div>
        <span className="type-caption text-xs">Great</span>
      </div>
    </div>
  );
}
