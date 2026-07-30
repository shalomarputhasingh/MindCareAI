"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flame, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatTile } from "@/components/shared/stat-tile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGuestId } from "@/hooks/use-guest-id";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { habitsApi, type HabitRecord } from "@/lib/api-client";
import { DEFAULT_HABITS, STORAGE_KEYS } from "@/lib/constants";
import { formatLongDate, recentDayKeys, toDayKey } from "@/lib/date";
import type { HabitDefinition } from "@/types";

import { computeStreak } from "@/features/mood/lib/streak";
import { AddHabitDialog } from "@/features/habits/components/add-habit-dialog";
import { HabitHeatmap } from "@/features/habits/components/habit-heatmap";
import { HabitRow } from "@/features/habits/components/habit-row";

const RANGE_DAYS = 30;

function withCompletion(
  current: Map<string, Map<string, boolean>>,
  name: string,
  date: string,
  completed: boolean,
) {
  const next = new Map(current);
  const forName = new Map(next.get(name));
  forName.set(date, completed);
  next.set(name, forName);
  return next;
}

export function HabitsPage() {
  const guestId = useGuestId();
  const todayKey = toDayKey();
  const days = useMemo(() => recentDayKeys(RANGE_DAYS, todayKey), [todayKey]);

  const { value: habits, setValue: setHabits, hydrated } = useLocalStorage<HabitDefinition[]>(
    STORAGE_KEYS.habits,
    DEFAULT_HABITS,
  );

  const [logs, setLogs] = useState<Map<string, Map<string, boolean>> | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadLogs = useCallback(() => {
    if (!guestId) return;
    setLoadError(false);
    habitsApi
      .range(guestId, RANGE_DAYS)
      .then((records: HabitRecord[]) => {
        const map = new Map<string, Map<string, boolean>>();
        for (const record of records) {
          const forName = map.get(record.name) ?? new Map<string, boolean>();
          forName.set(record.date, record.completed);
          map.set(record.name, forName);
        }
        setLogs(map);
      })
      .catch(() => setLoadError(true));
  }, [guestId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const completionByName = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!logs) return map;
    for (const [name, byDate] of logs) {
      const done = new Set<string>();
      for (const [date, completed] of byDate) {
        if (completed) done.add(date);
      }
      map.set(name, done);
    }
    return map;
  }, [logs]);

  const streakByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const habit of habits) {
      const done = completionByName.get(habit.name) ?? new Set<string>();
      map.set(habit.name, computeStreak(done, todayKey));
    }
    return map;
  }, [habits, completionByName, todayKey]);

  const doneToday = habits.filter((habit) =>
    completionByName.get(habit.name)?.has(todayKey),
  ).length;
  const total = habits.length;
  const bestStreak = habits.reduce(
    (max, habit) => Math.max(max, streakByName.get(habit.name) ?? 0),
    0,
  );

  const handleToggle = useCallback(
    (habit: HabitDefinition) => {
      if (!guestId) return;
      const wasCompleted = completionByName.get(habit.name)?.has(todayKey) ?? false;
      const nextCompleted = !wasCompleted;
      setLogs((current) =>
        withCompletion(current ?? new Map(), habit.name, todayKey, nextCompleted),
      );
      habitsApi
        .setCompleted(guestId, todayKey, habit.name, nextCompleted, habit.icon)
        .catch(() => {
          setLogs((current) =>
            withCompletion(current ?? new Map(), habit.name, todayKey, wasCompleted),
          );
          toast.error(`Couldn't update "${habit.name}". Try again.`);
        });
    },
    [guestId, completionByName, todayKey],
  );

  const handleAdd = useCallback(
    (name: string, icon: string) => {
      setHabits((current) => [...current, { name, icon, isCustom: true }]);
    },
    [setHabits],
  );

  const handleDelete = useCallback(
    (habit: HabitDefinition) => {
      if (!guestId) return;
      habitsApi
        .removeHistory(guestId, habit.name)
        .then(() => {
          setHabits((current) => current.filter((item) => item.name !== habit.name));
          setLogs((current) => {
            if (!current) return current;
            const next = new Map(current);
            next.delete(habit.name);
            return next;
          });
          toast.success(`${habit.name} removed.`);
        })
        .catch(() => toast.error(`Couldn't remove "${habit.name}". Try again.`));
    },
    [guestId, setHabits],
  );

  const ready = Boolean(guestId) && hydrated && logs !== null;

  return (
    <AppPage>
      <PageHeader
        title="Healthy habits"
        eyebrow={formatLongDate(todayKey)}
        description="Small things, daily. Missing one isn't a failure."
      />

      {!ready && !loadError ? (
        <SectionCard>
          <LoadingState rows={5} label="Loading your habits" />
        </SectionCard>
      ) : loadError ? (
        <SectionCard title="Couldn&rsquo;t load your habits">
          <p className="type-caption mb-4">
            The app couldn&rsquo;t reach the local server. Check that it&rsquo;s still running
            and try again.
          </p>
          <Button variant="outline" onClick={loadLogs}>
            Retry
          </Button>
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile
              label="Today's progress"
              value={
                <span className="tabular">
                  {doneToday} / {total}
                </span>
              }
              hint={total === 0 ? "no habits yet" : "habits done"}
              icon={ListChecks}
              tone="primary"
            />
            <StatTile
              label="Best current streak"
              value={<span className="tabular">{bestStreak}</span>}
              hint={bestStreak === 1 ? "day in a row" : "days in a row"}
              icon={Flame}
              tone="brand"
            />
          </div>

          <SectionCard
            title="Today"
            action={<AddHabitDialog existingNames={habits.map((h) => h.name)} onAdd={handleAdd} />}
          >
            {total > 0 ? (
              <div className="space-y-4">
                <Progress value={total === 0 ? 0 : (doneToday / total) * 100} />
                <div className="space-y-2">
                  {habits.map((habit) => (
                    <HabitRow
                      key={habit.name}
                      habit={habit}
                      completed={completionByName.get(habit.name)?.has(todayKey) ?? false}
                      streak={streakByName.get(habit.name) ?? 0}
                      onToggle={() => handleToggle(habit)}
                      onDelete={() => handleDelete(habit)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={ListChecks}
                title="No habits yet"
                description="Add the first small thing you'd like to keep track of."
              />
            )}
          </SectionCard>

          {total > 0 ? (
            <SectionCard title="Last 30 days" description="One row per habit.">
              <HabitHeatmap
                habits={habits}
                completionByName={completionByName}
                days={days}
                todayKey={todayKey}
              />
            </SectionCard>
          ) : null}
        </>
      )}
    </AppPage>
  );
}
