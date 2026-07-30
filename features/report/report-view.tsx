"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flame,
  ListChecks,
  MessageCircleHeart,
  NotebookPen,
  Smile,
} from "lucide-react";

import { AppPage } from "@/components/shared/app-page";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatTile } from "@/components/shared/stat-tile";
import { Button } from "@/components/ui/button";
import { useGuestId } from "@/hooks/use-guest-id";
import {
  type DailyReport,
  type HabitRecord,
  habitsApi,
  type MoodRecord,
  moodApi,
  reportApi,
} from "@/lib/api-client";
import { MOOD_OPTIONS } from "@/lib/constants";
import {
  formatLongDate,
  formatShortDate,
  recentDayKeys,
  shiftDayKey,
  toDayKey,
} from "@/lib/date";
import { cn } from "@/lib/utils";

const TREND_DAYS = 14;

/** One day's report, with history for streaks and a two-week trend strip. */
export function ReportView() {
  const guestId = useGuestId();
  const today = useMemo(() => toDayKey(), []);

  const [selectedDay, setSelectedDay] = useState(today);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodRecord[]>([]);
  const [habitHistory, setHabitHistory] = useState<HabitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!guestId) return;
    let cancelled = false;
    setLoading(true);

    reportApi
      .forDay(guestId, selectedDay)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        if (!cancelled) setReport(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [guestId, selectedDay]);

  // The `days=` range on these endpoints is always anchored to *real* today, not
  // to `selectedDay`, so the trend strip is fetched independently of day
  // navigation — it always shows the last two weeks ending today.
  useEffect(() => {
    if (!guestId) return;
    let cancelled = false;

    Promise.all([moodApi.range(guestId, TREND_DAYS), habitsApi.range(guestId, TREND_DAYS)])
      .then(([moods, habits]) => {
        if (cancelled) return;
        setMoodHistory(moods);
        setHabitHistory(habits);
      })
      .catch(() => {
        if (!cancelled) {
          setMoodHistory([]);
          setHabitHistory([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [guestId]);

  useEffect(() => {
    setCopied(false);
  }, [selectedDay]);

  const isToday = selectedDay === today;

  const hasAnything = Boolean(
    report &&
      (report.mood !== null ||
        report.habits.done > 0 ||
        (report.journal?.hasContent ?? false) ||
        report.chatMessages > 0),
  );

  const moodOption = report?.mood
    ? MOOD_OPTIONS.find((option) => option.score === report.mood?.score)
    : undefined;

  const trendDays = recentDayKeys(TREND_DAYS, today);

  const moodByDay = useMemo(
    () => new Map(moodHistory.map((entry) => [entry.date, entry.score])),
    [moodHistory],
  );

  const habitsByDay = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const log of habitHistory) {
      const existing = map.get(log.date) ?? { done: 0, total: 0 };
      existing.total += 1;
      if (log.completed) existing.done += 1;
      map.set(log.date, existing);
    }
    return map;
  }, [habitHistory]);

  function handleCopy() {
    if (!report?.summary) return;
    navigator.clipboard
      .writeText(report.summary)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  }

  const showLoading = loading || !guestId;

  return (
    <AppPage>
      <PageHeader
        eyebrow="Daily report"
        title={formatLongDate(selectedDay)}
        description="A quiet look back at one day. A low-mood day isn't a bad score, and a quiet day isn't a missed one."
        actions={
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous day"
              onClick={() => setSelectedDay((day) => shiftDayKey(day, -1))}
            >
              <ChevronLeft />
            </Button>
            {!isToday ? (
              <Button variant="outline" size="sm" onClick={() => setSelectedDay(today)}>
                Today
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="icon"
              aria-label="Next day"
              disabled={isToday}
              onClick={() => setSelectedDay((day) => shiftDayKey(day, 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        }
      />

      {showLoading ? (
        <LoadingState rows={5} label="Loading the report" />
      ) : !hasAnything ? (
        <EmptyState
          icon={Calendar}
          title={isToday ? "Nothing logged yet today" : "Nothing was logged this day"}
          description={
            isToday
              ? "Log a mood, write a line, or tick a habit, and it will show up here."
              : "There's no record for this day."
          }
          action={
            isToday ? (
              <Button asChild variant="brand">
                <Link href="/app/mood">Log your mood</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <SectionCard className="bg-brand-muted border-brand/20">
            <div className="flex items-start justify-between gap-4">
              <p className="type-heading text-brand-strong text-pretty">{report?.summary}</p>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Copy summary"
                onClick={handleCopy}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </SectionCard>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Today's mood"
              value={moodOption ? `${moodOption.emoji} ${moodOption.label}` : "Not logged"}
              icon={Smile}
              tone="brand"
            />
            <StatTile
              label="Habit completion"
              value={`${report?.habits.done ?? 0}/${report?.habits.total ?? 0}`}
              hint={
                report && report.habits.total > 0
                  ? report.habits.done === report.habits.total
                    ? "All done"
                    : "In progress"
                  : "No habits set up"
              }
              icon={ListChecks}
              tone="primary"
            />
            <StatTile
              label="Journal status"
              value={
                report?.journal?.hasContent ? `${report.journal.wordCount} words` : "Not written"
              }
              icon={NotebookPen}
              tone="primary"
            />
            <StatTile
              label="Chat activity"
              value={report?.chatMessages ?? 0}
              hint="messages"
              icon={MessageCircleHeart}
              tone="neutral"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SectionCard title="Mood streak">
              <div className="flex items-center gap-3">
                <span className="bg-brand-muted text-brand-strong flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Flame aria-hidden className="size-5" />
                </span>
                <p className="tabular type-title text-brand-strong">
                  {report?.streaks.mood ?? 0}{" "}
                  <span className="type-caption align-middle">
                    {report?.streaks.mood === 1 ? "day" : "days"}
                  </span>
                </p>
              </div>
            </SectionCard>
            <SectionCard title="Habit streak">
              <div className="flex items-center gap-3">
                <span className="bg-brand-muted text-brand-strong flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Flame aria-hidden className="size-5" />
                </span>
                <p className="tabular type-title text-brand-strong">
                  {report?.streaks.habits ?? 0}{" "}
                  <span className="type-caption align-middle">
                    {report?.streaks.habits === 1 ? "day" : "days"}
                  </span>
                </p>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Last two weeks"
            description={`${formatShortDate(trendDays[0])} – ${formatShortDate(
              trendDays[trendDays.length - 1],
            )}`}
          >
            <div className="space-y-5">
              <div>
                <p className="type-caption mb-2">Mood</p>
                <div className="flex h-16 items-end gap-1" role="img" aria-label="Mood over the last two weeks">
                  {trendDays.map((day) => {
                    const score = moodByDay.get(day);
                    return (
                      <div
                        key={day}
                        title={score ? `${formatShortDate(day)}: ${score} of 5` : formatShortDate(day)}
                        className="flex h-full flex-1 items-end overflow-hidden rounded-sm"
                      >
                        <div
                          className={cn(
                            "w-full rounded-t-sm",
                            score ? "bg-chart-2" : "bg-muted",
                          )}
                          style={{ height: score ? `${(score / 5) * 100}%` : "6%" }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="type-caption mb-2">Habit completion</p>
                <div
                  className="flex h-16 items-end gap-1"
                  role="img"
                  aria-label="Habit completion over the last two weeks"
                >
                  {trendDays.map((day) => {
                    const entry = habitsByDay.get(day);
                    const ratio = entry && entry.total > 0 ? entry.done / entry.total : 0;
                    return (
                      <div
                        key={day}
                        title={
                          entry && entry.total > 0
                            ? `${formatShortDate(day)}: ${entry.done} of ${entry.total}`
                            : formatShortDate(day)
                        }
                        className="flex h-full flex-1 items-end overflow-hidden rounded-sm"
                      >
                        <div
                          className={cn("w-full rounded-t-sm", ratio > 0 ? "bg-chart-1" : "bg-muted")}
                          style={{ height: ratio > 0 ? `${ratio * 100}%` : "6%" }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </AppPage>
  );
}
