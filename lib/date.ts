/**
 * Day keys.
 *
 * Journal entries, moods and habit logs are keyed by the user's *local* calendar
 * day as a `YYYY-MM-DD` string. Using a string rather than a DateTime keeps
 * "one per day" enforceable by a unique index and immune to timezone drift.
 */

/** `YYYY-MM-DD` for a date in the local timezone. */
export function toDayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` key back into a local-midnight Date. */
export function fromDayKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isValidDayKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = fromDayKey(value);
  return !Number.isNaN(parsed.getTime()) && toDayKey(parsed) === value;
}

/** Day key `days` before (negative) or after (positive) the given day. */
export function shiftDayKey(key: string, days: number): string {
  const date = fromDayKey(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

/** Inclusive list of day keys from the oldest to `end`, `count` entries long. */
export function recentDayKeys(count: number, end: string = toDayKey()): string[] {
  return Array.from({ length: count }, (_, index) => shiftDayKey(end, index - count + 1));
}

/** e.g. "Thursday, 30 July" — used in page headers. */
export function formatLongDate(key: string): string {
  return fromDayKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** e.g. "30 Jul" — used in compact lists and charts. */
export function formatShortDate(key: string): string {
  return fromDayKey(key).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** A greeting appropriate to the current hour. */
export function greetingForHour(hour: number = new Date().getHours()): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
