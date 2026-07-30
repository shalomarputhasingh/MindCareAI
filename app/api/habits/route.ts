import { NextResponse } from "next/server";

import {
  BadRequest,
  handle,
  optionalBoundedInt,
  readJson,
  requireDayKey,
  requireGuestId,
  requireString,
} from "@/lib/api";
import { shiftDayKey, toDayKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/habits?guestId=…&date=…  → that day's completion rows
 * GET /api/habits?guestId=…&days=30 → recent rows, for streaks and history
 */
export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const guestId = requireGuestId(params.get("guestId"));

    if (params.has("days")) {
      const days = optionalBoundedInt(params.get("days"), 30, 1, 400);
      const from = shiftDayKey(toDayKey(), -(days - 1));
      const logs = await prisma.habit.findMany({
        where: { guestId, date: { gte: from } },
        orderBy: { date: "asc" },
      });
      return NextResponse.json({ logs });
    }

    const date = requireDayKey(params.get("date"), true);
    const logs = await prisma.habit.findMany({
      where: { guestId, date },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ logs });
  });
}

/** PUT /api/habits — record whether one habit was completed on one day. */
export async function PUT(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const guestId = requireGuestId(body.guestId);
    const date = requireDayKey(body.date, true);
    const name = requireString(body.name, "Habit name", 60).trim();
    if (!name) throw new BadRequest("Habit name is required.");

    const icon = typeof body.icon === "string" ? body.icon.slice(0, 40) : null;
    const completed = Boolean(body.completed);

    const log = await prisma.habit.upsert({
      where: { guestId_date_name: { guestId, date, name } },
      create: { guestId, date, name, icon, completed },
      update: { completed, icon },
    });

    return NextResponse.json({ log });
  });
}

/**
 * DELETE /api/habits?guestId=…&name=…
 * Removes a habit's entire history — used when a custom habit is deleted.
 */
export async function DELETE(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const guestId = requireGuestId(params.get("guestId"));
    const name = requireString(params.get("name"), "Habit name", 60);

    await prisma.habit.deleteMany({ where: { guestId, name } });
    return NextResponse.json({ ok: true });
  });
}
