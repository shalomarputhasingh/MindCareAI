import { NextResponse } from "next/server";

import { handle, requireDayKey, requireGuestId } from "@/lib/api";
import { shiftDayKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/report?guestId=…&date=…
 *
 * One day's summary, plus the streaks that make it feel like progress. The
 * encouraging sentence is written here rather than by the model, so the report
 * works with no API key and never costs a request.
 */
export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const guestId = requireGuestId(params.get("guestId"));
    const date = requireDayKey(params.get("date"), true);
    const from = shiftDayKey(date, -59);

    const [mood, journal, habits, chatCount, moodHistory, habitHistory] =
      await Promise.all([
        prisma.mood.findUnique({ where: { guestId_date: { guestId, date } } }),
        prisma.journal.findUnique({ where: { guestId_date: { guestId, date } } }),
        prisma.habit.findMany({ where: { guestId, date } }),
        prisma.chatHistory.count({
          where: { guestId, createdAt: { gte: new Date(`${date}T00:00:00`) } },
        }),
        prisma.mood.findMany({
          where: { guestId, date: { gte: from, lte: date } },
          orderBy: { date: "desc" },
          select: { date: true, score: true },
        }),
        prisma.habit.findMany({
          where: { guestId, date: { gte: from, lte: date }, completed: true },
          select: { date: true },
        }),
      ]);

    const habitsDone = habits.filter((habit) => habit.completed).length;

    return NextResponse.json({
      date,
      mood: mood ? { score: mood.score, note: mood.note } : null,
      journal: journal
        ? { wordCount: journal.wordCount, hasContent: journal.content.trim().length > 0 }
        : null,
      habits: { done: habitsDone, total: habits.length },
      chatMessages: chatCount,
      streaks: {
        mood: countStreak(
          date,
          moodHistory.map((entry) => entry.date),
        ),
        habits: countStreak(date, habitHistory.map((entry) => entry.date)),
      },
      summary: writeSummary({
        moodScore: mood?.score ?? null,
        habitsDone,
        habitsTotal: habits.length,
        journalWords: journal?.wordCount ?? 0,
      }),
    });
  });
}

/**
 * Consecutive days ending at `endDate` that appear in `dates`.
 * Today not being logged yet doesn't break a streak — yesterday's still counts.
 */
function countStreak(endDate: string, dates: string[]): number {
  const seen = new Set(dates);
  let cursor = endDate;
  let streak = 0;

  if (!seen.has(cursor)) {
    cursor = shiftDayKey(cursor, -1);
    if (!seen.has(cursor)) return 0;
  }

  while (seen.has(cursor)) {
    streak += 1;
    cursor = shiftDayKey(cursor, -1);
  }

  return streak;
}

/**
 * A short, honest line about the day. It never congratulates someone for a low
 * mood and never implies they've fallen behind.
 */
function writeSummary(input: {
  moodScore: number | null;
  habitsDone: number;
  habitsTotal: number;
  journalWords: number;
}): string {
  const { moodScore, habitsDone, habitsTotal, journalWords } = input;
  const parts: string[] = [];

  if (moodScore === null && habitsDone === 0 && journalWords === 0) {
    return "Nothing logged yet today. Whenever you're ready, a mood check-in takes a second.";
  }

  if (moodScore !== null) {
    if (moodScore <= 2) {
      parts.push("Today has been heavy, and you still showed up to note it down.");
    } else if (moodScore === 3) {
      parts.push("An even sort of day, by your own account.");
    } else {
      parts.push("You've had a good day by your own measure.");
    }
  }

  if (habitsTotal > 0) {
    if (habitsDone === habitsTotal) {
      parts.push(`Every habit is ticked off — all ${habitsTotal}.`);
    } else if (habitsDone > 0) {
      parts.push(`${habitsDone} of ${habitsTotal} habits done.`);
    }
  }

  if (journalWords > 0) {
    parts.push(`You wrote ${journalWords} ${journalWords === 1 ? "word" : "words"}.`);
  }

  if (parts.length === 0) {
    return "You've made a start today. That counts.";
  }

  return parts.join(" ");
}
