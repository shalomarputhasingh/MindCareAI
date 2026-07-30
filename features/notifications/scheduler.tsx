"use client";

import { useEffect, useRef } from "react";

import { useNotifications } from "@/hooks/use-notifications";
import { toDayKey } from "@/lib/date";

import { REMINDERS } from "./reminders";

const CHECK_INTERVAL_MS = 30_000;

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Mounts invisibly and fires each enabled reminder once a day, at its fixed
 * local time. Renders nothing.
 *
 * The interval is created once and reads live preferences through a ref. Making
 * the effect depend on `preferences` instead would tear the timer down on every
 * re-render — including every navigation, since the shell re-renders on route
 * change — and reset the schedule baseline each time.
 */
export function NotificationScheduler() {
  const { preferences, hydrated, permission } = useNotifications();

  // Latest values for the interval to read, without re-arming it.
  const stateRef = useRef({ preferences, hydrated, permission });
  stateRef.current = { preferences, hydrated, permission };

  /** Day key of the last firing, per reminder. */
  const firedOnRef = useRef<Record<string, string>>({});
  /** Where the previous tick left off, so we can detect times we just passed. */
  const lastTickRef = useRef<{ day: string; minute: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    // Establish the baseline immediately. Opening the app at 23:00 must not
    // dump every reminder scheduled earlier in the day.
    const startedAt = new Date();
    lastTickRef.current = {
      day: toDayKey(startedAt),
      minute: minutesSinceMidnight(startedAt),
    };

    function tick() {
      const { preferences, hydrated, permission } = stateRef.current;
      if (!hydrated || !preferences.enabled || permission !== "granted") return;

      const now = new Date();
      const day = toDayKey(now);
      const minute = minutesSinceMidnight(now);
      const previous = lastTickRef.current;
      lastTickRef.current = { day, minute };
      if (!previous) return;

      // Once the date rolls over, everything from 00:00 counts as newly passed.
      const since = previous.day === day ? previous.minute : -1;

      for (const reminder of REMINDERS) {
        if (!preferences[reminder.key]) continue;
        if (firedOnRef.current[reminder.key] === day) continue;

        // Edge-triggered on the window we just moved through, rather than an
        // exact minute match: background tabs throttle setInterval well past a
        // minute, which would silently drop the reminder for that day.
        const scheduled = reminder.hour * 60 + reminder.minute;
        if (scheduled <= since || scheduled > minute) continue;

        firedOnRef.current[reminder.key] = day;
        try {
          new Notification(reminder.title, { body: reminder.body, tag: reminder.key });
        } catch {
          // Some browsers throw when a notification can't be shown right now
          // (OS do-not-disturb, for example). Skip it rather than crash.
        }
      }
    }

    const interval = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
