import type { MoodScore } from "@/types";

/**
 * A low mood is never "bad", so the calendar never reaches for a red→green
 * "good/bad" scale. Instead every score tints the same brand teal — the
 * colour the design system reserves for the user's own reflection — and only
 * the *intensity* rises with the score. Struggling days stay visible, just
 * quieter than a great day.
 */
const MOOD_INTENSITY: Record<MoodScore, string> = {
  1: "bg-brand/15",
  2: "bg-brand/28",
  3: "bg-brand/42",
  4: "bg-brand/58",
  5: "bg-brand/75",
};

export function moodTint(score: MoodScore): string {
  return MOOD_INTENSITY[score];
}
