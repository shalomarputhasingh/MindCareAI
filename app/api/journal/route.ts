import { NextResponse } from "next/server";

import {
  countWords,
  handle,
  optionalBoundedInt,
  readJson,
  requireDayKey,
  requireGuestId,
  requireString,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/journal?guestId=…&date=YYYY-MM-DD  → that day's entry, or null
 * GET /api/journal?guestId=…&history=1&limit= → recent entries, newest first
 */
export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const guestId = requireGuestId(params.get("guestId"));

    if (params.get("history")) {
      const limit = optionalBoundedInt(params.get("limit"), 30, 1, 365);
      const entries = await prisma.journal.findMany({
        where: { guestId },
        orderBy: { date: "desc" },
        take: limit,
      });
      return NextResponse.json({ entries });
    }

    const date = requireDayKey(params.get("date"), true);
    const entry = await prisma.journal.findUnique({
      where: { guestId_date: { guestId, date } },
    });
    return NextResponse.json({ entry });
  });
}

/** PUT /api/journal — upsert the entry for one day. Used by autosave. */
export async function PUT(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const guestId = requireGuestId(body.guestId);
    const date = requireDayKey(body.date, true);
    const content = requireString(body.content ?? "", "Journal entry", 100_000);
    const wordCount = countWords(content);

    const entry = await prisma.journal.upsert({
      where: { guestId_date: { guestId, date } },
      create: { guestId, date, content, wordCount },
      update: { content, wordCount },
    });

    return NextResponse.json({ entry });
  });
}

/** DELETE /api/journal?guestId=…&date=… */
export async function DELETE(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const guestId = requireGuestId(params.get("guestId"));
    const date = requireDayKey(params.get("date"));

    await prisma.journal.deleteMany({ where: { guestId, date } });
    return NextResponse.json({ ok: true });
  });
}
