import { formatShortDate } from "@/lib/date";
import { MOOD_OPTIONS } from "@/lib/constants";
import type { MoodScore } from "@/types";

const LABEL_BY_SCORE = new Map(MOOD_OPTIONS.map((option) => [option.score, option.label]));

interface MoodTrendProps {
  /** Oldest first. */
  days: { date: string; score: MoodScore | null }[];
}

/** A gentle last-14-days trend: one bar per day, height carries the score. */
export function MoodTrend({ days }: MoodTrendProps) {
  return (
    <div className="space-y-2">
      <div
        role="list"
        aria-label="Mood over the last 14 days"
        className="flex h-28 items-end gap-1.5 sm:gap-2"
      >
        {days.map((day) => {
          const heightPct = day.score ? (day.score / 5) * 100 : 6;
          const label = day.score
            ? `${formatShortDate(day.date)} — ${LABEL_BY_SCORE.get(day.score)}`
            : `${formatShortDate(day.date)} — no check-in`;
          return (
            <div
              key={day.date}
              role="listitem"
              tabIndex={0}
              title={label}
              aria-label={label}
              className="flex flex-1 items-end justify-center focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <div
                className={day.score ? "w-full rounded-t-sm bg-brand" : "w-full rounded-t-sm bg-muted"}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="border-border flex items-center justify-between border-t pt-1.5">
        <span className="type-caption text-xs">{formatShortDate(days[0]?.date ?? "")}</span>
        <span className="type-caption text-xs">
          {formatShortDate(days[days.length - 1]?.date ?? "")}
        </span>
      </div>
    </div>
  );
}
