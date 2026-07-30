import type { NotificationPreferences } from "@/types";

export type ReminderKey = "water" | "meditation" | "journal" | "sleep";

export interface ReminderConfig {
  key: ReminderKey;
  title: string;
  body: string;
  /** 24-hour local time this reminder fires, once a day. */
  hour: number;
  minute: number;
}

/**
 * One fixed check-in time per reminder. Deliberately not user-configurable —
 * simple and predictable beats a settings-within-settings sub-form.
 */
export const REMINDERS: ReminderConfig[] = [
  {
    key: "water",
    title: "Drink water",
    body: "A quick glass of water — small thing, daily.",
    hour: 10,
    minute: 0,
  },
  {
    key: "meditation",
    title: "Meditation time",
    body: "Take five minutes to breathe and reset.",
    hour: 15,
    minute: 0,
  },
  {
    key: "journal",
    title: "Journal reminder",
    body: "Write a few lines about your day.",
    hour: 20,
    minute: 0,
  },
  {
    key: "sleep",
    title: "Sleep reminder",
    body: "Start winding down for a good night's sleep.",
    hour: 22,
    minute: 0,
  },
];

export function isReminderEnabled(preferences: NotificationPreferences, key: ReminderKey): boolean {
  return preferences.enabled && preferences[key];
}
