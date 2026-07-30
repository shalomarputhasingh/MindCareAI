"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { useGuestId } from "@/hooks/use-guest-id";
import { journalApi, type JournalRecord } from "@/lib/api-client";
import { shiftDayKey, toDayKey } from "@/lib/date";

import { JournalEditor, type SaveStatus } from "@/features/journal/components/journal-editor";
import { JournalHistory } from "@/features/journal/components/journal-history";
import { countWords } from "@/features/journal/lib/word-count";

const AUTOSAVE_DELAY = 900;

export function JournalPage() {
  const guestId = useGuestId();
  const todayKey = toDayKey();

  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [dayLoading, setDayLoading] = useState(true);
  const [dayLoadError, setDayLoadError] = useState(false);

  const [history, setHistory] = useState<JournalRecord[] | null>(null);
  const [historyError, setHistoryError] = useState(false);

  /** The content most recently confirmed saved (or loaded) for `selectedDate`. */
  const lastSavedRef = useRef("");
  /** Guards autosave from firing while a day's entry is still loading in. */
  const loadedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!guestId) return;
    journalApi
      .history(guestId, 120)
      .then(setHistory)
      .catch(() => setHistoryError(true));
  }, [guestId]);

  const loadEntry = useCallback(() => {
    if (!guestId) return;
    loadedRef.current = false;
    setDayLoading(true);
    setDayLoadError(false);
    journalApi
      .get(guestId, selectedDate)
      .then((entry) => {
        const value = entry?.content ?? "";
        lastSavedRef.current = value;
        setContent(value);
        setStatus("idle");
      })
      .catch(() => setDayLoadError(true))
      .finally(() => {
        setDayLoading(false);
        loadedRef.current = true;
      });
  }, [guestId, selectedDate]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const upsertHistory = useCallback((entry: JournalRecord) => {
    setHistory((current) => {
      const others = (current ?? []).filter((item) => item.date !== entry.date);
      return [...others, entry];
    });
  }, []);

  const saveNow = useCallback(() => {
    if (!guestId) return;
    if (content === lastSavedRef.current) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const dateToSave = selectedDate;
    const contentToSave = content;
    setStatus("saving");
    journalApi
      .save(guestId, dateToSave, contentToSave)
      .then((entry) => {
        lastSavedRef.current = entry.content;
        setStatus("saved");
        upsertHistory(entry);
      })
      .catch(() => setStatus("error"));
  }, [guestId, content, selectedDate, upsertHistory]);

  // Debounced autosave, ~900ms after typing stops.
  useEffect(() => {
    if (!loadedRef.current) return;
    if (content === lastSavedRef.current) return;
    setStatus("dirty");
    debounceRef.current = setTimeout(saveNow, AUTOSAVE_DELAY);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Re-running this on every keystroke (via `content`) is the point — each
    // keystroke restarts the debounce window. `saveNow` intentionally isn't a
    // dependency: it's recreated whenever `content` changes anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const wordCount = useMemo(() => countWords(content), [content]);
  const ready = Boolean(guestId) && !dayLoading;

  return (
    <AppPage width="wide">
      <PageHeader title="Daily journal" description="A quiet place to write it down." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SectionCard contentClassName="min-h-[32rem]">
          {!ready ? (
            <LoadingState rows={5} label="Loading your entry" />
          ) : dayLoadError ? (
            <div className="space-y-3">
              <p className="type-caption">
                Couldn&rsquo;t load this entry. Check that the app&rsquo;s local server is
                running, then try again.
              </p>
              <Button variant="outline" onClick={loadEntry}>
                Retry
              </Button>
            </div>
          ) : (
            <JournalEditor
              date={selectedDate}
              isToday={selectedDate === todayKey}
              content={content}
              wordCount={wordCount}
              status={status}
              onChange={setContent}
              onBlur={saveNow}
              onRetry={saveNow}
              onPrevDay={() => setSelectedDate((date) => shiftDayKey(date, -1))}
              onNextDay={() => setSelectedDate((date) => shiftDayKey(date, 1))}
              canGoNext={selectedDate < todayKey}
              onJumpToday={() => setSelectedDate(todayKey)}
            />
          )}
        </SectionCard>

        <SectionCard title="History" description="Newest first.">
          <JournalHistory
            entries={history}
            error={historyError}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </SectionCard>
      </div>
    </AppPage>
  );
}
