import { NextResponse } from "next/server";

import {
  handle,
  optionalBoundedInt,
  readJson,
  requireDayKey,
  requireGuestId,
  requireInt,
} from "@/lib/api";
import { shiftDayKey, toDayKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/mood?guestId=…&date=…   → that day's mood, or null
 * GET /api/mood?guestId=…&days=90  → the last N days, oldest first
 */
export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const guestId = requireGuestId(params.get("guestId"));

    if (params.has("days")) {
      const days = optionalBoundedInt(params.get("days"), 90, 1, 400);
      const from = shiftDayKey(toDayKey(), -(days - 1));
      const entries = await prisma.mood.findMany({
        where: { guestId, date: { gte: from } },
        orderBy: { date: "asc" },
      });
      return NextResponse.json({ entries });
    }

    const date = requireDayKey(params.get("date"), true);
    const entry = await prisma.mood.findUnique({
      where: { guestId_date: { guestId, date } },
    });
    return NextResponse.json({ entry });
  });
}

/** PUT /api/mood — one mood per day; sending again replaces it. */
export async function PUT(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const guestId = requireGuestId(body.guestId);
    const date = requireDayKey(body.date, true);
    const score = requireInt(body.score, "Mood", 1, 5);
    const note =
      typeof body.note === "string" && body.note.trim()
        ? body.note.trim().slice(0, 500)
        : null;

    const entry = await prisma.mood.upsert({
      where: { guestId_date: { guestId, date } },
      create: { guestId, date, score, note },
      update: { score, note },
    });

    return NextResponse.json({ entry });
  });
}
