import { formatShortDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { HabitDefinition } from "@/types";

import { DayCell } from "@/features/mood/components/day-cell";
import { resolveHabitIcon } from "@/features/habits/lib/icon-map";

interface HabitHeatmapProps {
  habits: HabitDefinition[];
  /** Habit name → set of day keys completed within `days`. */
  completionByName: Map<string, Set<string>>;
  /** Oldest first. */
  days: string[];
  todayKey: string;
}

/** Last-30-days completion grid, one row per habit. */
export function HabitHeatmap({ habits, completionByName, days, todayKey }: HabitHeatmapProps) {
  return (
    <div className="scrollbar-slim -mx-1 overflow-x-auto px-1">
      <div className="min-w-[36rem] space-y-3">
        {habits.map((habit) => {
          const Icon = resolveHabitIcon(habit.icon);
          const completed = completionByName.get(habit.name) ?? new Set<string>();
          return (
            <div key={habit.name} className="flex items-center gap-3">
              <div className="flex w-32 shrink-0 items-center gap-2">
                <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <span className="type-caption truncate text-xs font-medium">{habit.name}</span>
              </div>
              <div className="flex flex-1 gap-1">
                {days.map((date) => {
                  const done = completed.has(date);
                  const label = `${formatShortDate(date)} — ${done ? "done" : "not done"}`;
                  return (
                    <DayCell
                      key={date}
                      size="sm"
                      label={label}
                      current={date === todayKey}
                      className={cn(done ? "bg-brand" : "bg-muted")}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
