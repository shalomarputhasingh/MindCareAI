"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flame, SmilePlus } from "lucide-react";
import { toast } from "sonner";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { LoadingState } from "@/components/shared/loading-state";
import { StatTile } from "@/components/shared/stat-tile";
import { Button } from "@/components/ui/button";
import { useGuestId } from "@/hooks/use-guest-id";
import { moodApi, type MoodRecord } from "@/lib/api-client";
import { formatLongDate, recentDayKeys, toDayKey } from "@/lib/date";
import type { MoodScore } from "@/types";

import { computeStreak } from "@/features/mood/lib/streak";
import { MoodCalendar } from "@/features/mood/components/mood-calendar";
import { MoodPicker } from "@/features/mood/components/mood-picker";
import { MoodTrend } from "@/features/mood/components/mood-trend";

const RANGE_DAYS = 365;

export function MoodTrackerPage() {
  const guestId = useGuestId();
  const todayKey = toDayKey();

  const [entries, setEntries] = useState<Map<string, MoodRecord> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!guestId) return;
    setLoadError(false);
    moodApi
      .range(guestId, RANGE_DAYS)
      .then((records) => setEntries(new Map(records.map((r) => [r.date, r]))))
      .catch(() => setLoadError(true));
  }, [guestId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = useCallback(
    (score: MoodScore, note: string) => {
      if (!guestId) return;
      setSaving(true);
      moodApi
        .save(guestId, todayKey, score, note || undefined)
        .then((entry) => {
          setEntries((current) => {
            const next = new Map(current ?? []);
            next.set(entry.date, entry);
            return next;
          });
          toast.success("Mood saved for today.");
        })
        .catch(() => {
          toast.error("Couldn't save your mood. Try again in a moment.");
        })
        .finally(() => setSaving(false));
    },
    [guestId, todayKey],
  );

  const todayEntry = entries?.get(todayKey) ?? null;

  const streak = useMemo(() => {
    if (!entries) return 0;
    return computeStreak(entries.keys(), todayKey);
  }, [entries, todayKey]);

  const monthCount = useMemo(() => {
    if (!entries) return 0;
    const prefix = todayKey.slice(0, 7);
    let count = 0;
    for (const date of entries.keys()) {
      if (date.startsWith(prefix)) count += 1;
    }
    return count;
  }, [entries, todayKey]);

  const trendDays = useMemo(() => {
    const keys = recentDayKeys(14, todayKey);
    return keys.map((date) => ({ date, score: entries?.get(date)?.score ?? null }));
  }, [entries, todayKey]);

  const ready = Boolean(guestId) && entries !== null;

  return (
    <AppPage>
      <PageHeader
        title="Mood tracker"
        eyebrow={formatLongDate(todayKey)}
        description="One check-in a day — however today feels."
      />

      {!ready && !loadError ? (
        <SectionCard>
          <LoadingState rows={4} label="Loading your mood history" />
        </SectionCard>
      ) : loadError ? (
        <SectionCard title="Couldn&rsquo;t load your mood history">
          <p className="type-caption mb-4">
            The app couldn&rsquo;t reach the local server. Check that it&rsquo;s still running
            and try again.
          </p>
          <Button variant="outline" onClick={load}>
            Retry
          </Button>
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Today">
            <MoodPicker
              initialScore={todayEntry?.score ?? null}
              initialNote={todayEntry?.note ?? ""}
              saving={saving}
              onSave={handleSave}
            />
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile
              label="Current streak"
              value={<span className="tabular">{streak}</span>}
              hint={streak === 1 ? "day in a row" : "days in a row"}
              icon={Flame}
              tone="brand"
            />
            <StatTile
              label="Check-ins this month"
              value={<span className="tabular">{monthCount}</span>}
              hint="days logged so far"
              icon={SmilePlus}
              tone="primary"
            />
          </div>

          <SectionCard title="Recent trend" description="The last 14 days.">
            <MoodTrend days={trendDays} />
          </SectionCard>

          <SectionCard title="History" description="Every logged day, tinted by mood.">
            <MoodCalendar entries={entries!} />
          </SectionCard>
        </>
      )}
    </AppPage>
  );
}
