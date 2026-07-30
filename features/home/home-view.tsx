"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ListChecks,
  MessageCircleHeart,
  NotebookPen,
  Smile,
  SmilePlus,
  Sparkles,
} from "lucide-react";

import { AppPage } from "@/components/shared/app-page";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { Button } from "@/components/ui/button";
import { useGuestId } from "@/hooks/use-guest-id";
import { type DailyReport, reportApi } from "@/lib/api-client";
import { MOOD_OPTIONS } from "@/lib/constants";
import { formatLongDate, greetingForHour, toDayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    href: "/app/mood",
    label: "Log your mood",
    hint: "One tap, once a day",
    icon: SmilePlus,
  },
  {
    href: "/app/journal",
    label: "Write in your journal",
    hint: "A few lines is enough",
    icon: NotebookPen,
  },
  {
    href: "/app/habits",
    label: "Tick off a habit",
    hint: "Small things, daily",
    icon: ListChecks,
  },
  {
    href: "/app/chat",
    label: "Talk it through",
    hint: "Your AI companion is here",
    icon: MessageCircleHeart,
  },
] as const;

/** The daily front door: a warm greeting, quick actions, and today so far. */
export function HomeView() {
  const guestId = useGuestId();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const today = toDayKey();

  useEffect(() => {
    if (!guestId) return;
    let cancelled = false;
    setLoading(true);

    reportApi
      .forDay(guestId, today)
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
  }, [guestId, today]);

  const greeting = greetingForHour();
  const dateLabel = formatLongDate(today);

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

  const showLoading = loading || !guestId;

  return (
    <AppPage>
      <div className="aurora rounded-2xl px-5 py-8 sm:px-8 sm:py-10">
        <PageHeader
          eyebrow={dateLabel}
          title={`${greeting}.`}
          description={
            !showLoading && report?.summary
              ? report.summary
              : "A calm place to check in with yourself, whenever you're ready."
          }
        />
      </div>

      <section aria-labelledby="quick-actions-heading" className="space-y-3">
        <h2 id="quick-actions-heading" className="type-eyebrow">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "surface animate-rise group flex flex-col gap-3 rounded-xl p-4",
                "transition-shadow hover:shadow-lift",
              )}
            >
              <span className="bg-brand-muted text-brand-strong flex size-10 items-center justify-center rounded-full transition-transform group-hover:scale-105">
                <action.icon aria-hidden className="size-5" />
              </span>
              <div className="space-y-0.5">
                <p className="type-heading">{action.label}</p>
                <p className="type-caption">{action.hint}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="today-heading" className="space-y-3">
        <h2 id="today-heading" className="type-eyebrow">
          Today so far
        </h2>

        {showLoading ? (
          <LoadingState rows={4} label="Loading today's summary" />
        ) : !hasAnything ? (
          <EmptyState
            icon={Sparkles}
            title="Nothing logged yet today"
            description="Whenever you're ready, start with whichever feels easiest."
            action={
              <Button asChild variant="brand">
                <Link href="/app/mood">Log your mood</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Mood"
              value={moodOption ? `${moodOption.emoji} ${moodOption.label}` : "Not yet"}
              icon={Smile}
              tone="brand"
            />
            <StatTile
              label="Habits"
              value={`${report?.habits.done ?? 0}/${report?.habits.total ?? 0}`}
              hint={
                report && report.habits.total > 0
                  ? report.habits.done === report.habits.total
                    ? "All done"
                    : "In progress"
                  : "None set up yet"
              }
              icon={ListChecks}
              tone="primary"
            />
            <StatTile
              label="Journal"
              value={report?.journal?.wordCount ?? 0}
              hint="words written"
              icon={NotebookPen}
              tone="primary"
            />
            <StatTile
              label="Chat"
              value={report?.chatMessages ?? 0}
              hint="messages today"
              icon={MessageCircleHeart}
              tone="neutral"
            />
          </div>
        )}
      </section>
    </AppPage>
  );
}
