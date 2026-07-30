"use client";

import { useEffect, useRef } from "react";

import { useNotifications } from "@/hooks/use-notifications";

import { REMINDERS } from "./reminders";

const CHECK_INTERVAL_MS = 30_000;

/**
 * Mounts invisibly and fires each enabled reminder once a day, at its fixed
 * local time. Renders nothing.
 *
 * Not mounted by this feature — export only. The app shell (`components/layout/app-shell.tsx`)
 * is the right place to render it once, near the root, but that file is
 * outside this module's ownership.
 */
export function NotificationScheduler() {
  const { preferences, hydrated, permission } = useNotifications();
  const firedTodayRef = useRef<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (!hydrated || !preferences.enabled || permission !== "granted") return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    function tick() {
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);

      for (const reminder of REMINDERS) {
        if (!preferences[reminder.key]) continue;
        if (now.getHours() !== reminder.hour || now.getMinutes() !== reminder.minute) continue;
        if (firedTodayRef.current[reminder.key] === todayKey) continue;

        firedTodayRef.current[reminder.key] = todayKey;
        try {
          new Notification(reminder.title, { body: reminder.body, tag: reminder.key });
        } catch {
          // Some browsers throw if the page can't show one right now (e.g. an
          // OS-level do-not-disturb) — safe to skip and try again tomorrow.
        }
      }
    }

    tick();
    const interval = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hydrated, preferences, permission]);

  return null;
}
