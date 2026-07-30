import { shiftDayKey, toDayKey } from "@/lib/date";

/**
 * Length of the run of consecutive day keys, ending at `asOf` (default today)
 * or the day before it, present in `presentDays`.
 *
 * Not logging *today* yet must not break a streak that ran through yesterday,
 * so the run is allowed to start one day back when today itself is missing.
 * Shared by the mood streak and the per-habit streak in the habits feature.
 */
export function computeStreak(
  presentDays: Iterable<string>,
  asOf: string = toDayKey(),
): number {
  const set = presentDays instanceof Set ? presentDays : new Set(presentDays);

  let cursor = asOf;
  if (!set.has(cursor)) {
    cursor = shiftDayKey(cursor, -1);
    if (!set.has(cursor)) return 0;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = shiftDayKey(cursor, -1);
  }
  return streak;
}
