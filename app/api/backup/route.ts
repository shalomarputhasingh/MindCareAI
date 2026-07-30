import { NextResponse } from "next/server";

import { BadRequest, countWords, handle, readJson, requireGuestId } from "@/lib/api";
import { isValidDayKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";

const BACKUP_VERSION = 1;

/**
 * GET /api/backup?guestId=… — everything this guest has stored, as one object.
 * Settings are added on the client, since they live in localStorage.
 */
export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const guestId = requireGuestId(params.get("guestId"));

    const [journals, moods, habits, chat] = await Promise.all([
      prisma.journal.findMany({ where: { guestId }, orderBy: { date: "asc" } }),
      prisma.mood.findMany({ where: { guestId }, orderBy: { date: "asc" } }),
      prisma.habit.findMany({ where: { guestId }, orderBy: { date: "asc" } }),
      prisma.chatHistory.findMany({ where: { guestId }, orderBy: { createdAt: "asc" } }),
    ]);

    return NextResponse.json({
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      journals: journals.map(({ date, content, wordCount }) => ({
        date,
        content,
        wordCount,
      })),
      moods: moods.map(({ date, score, note }) => ({ date, score, note })),
      habits: habits.map(({ date, name, icon, completed }) => ({
        date,
        name,
        icon,
        completed,
      })),
      chat: chat.map(({ role, content, createdAt }) => ({
        role,
        content,
        createdAt: createdAt.toISOString(),
      })),
    });
  });
}

/**
 * POST /api/backup — restores a previously exported file.
 *
 * Import is additive and idempotent: existing days are overwritten by the
 * imported version, and days not in the file are left alone. Chat is skipped if
 * the log already has messages, so a restore can't duplicate a conversation.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const guestId = requireGuestId(body.guestId);
    const data = body.data;

    if (!data || typeof data !== "object") {
      throw new BadRequest("That file doesn't look like a MindCareAI backup.");
    }

    const backup = data as Record<string, unknown>;
    if (backup.version !== BACKUP_VERSION) {
      throw new BadRequest(
        `This backup is version ${String(backup.version ?? "unknown")}, and this app reads version ${BACKUP_VERSION}.`,
      );
    }

    const counts = { journals: 0, moods: 0, habits: 0, chat: 0 };

    for (const item of asArray(backup.journals)) {
      const date = item.date;
      const content = item.content;
      if (!isValidDayKey(date) || typeof content !== "string") continue;
      await prisma.journal.upsert({
        where: { guestId_date: { guestId, date } },
        create: { guestId, date, content, wordCount: countWords(content) },
        update: { content, wordCount: countWords(content) },
      });
      counts.journals += 1;
    }

    for (const item of asArray(backup.moods)) {
      const date = item.date;
      const score = Number(item.score);
      if (!isValidDayKey(date) || !Number.isInteger(score) || score < 1 || score > 5) {
        continue;
      }
      const note = typeof item.note === "string" ? item.note.slice(0, 500) : null;
      await prisma.mood.upsert({
        where: { guestId_date: { guestId, date } },
        create: { guestId, date, score, note },
        update: { score, note },
      });
      counts.moods += 1;
    }

    for (const item of asArray(backup.habits)) {
      const date = item.date;
      const name = typeof item.name === "string" ? item.name.trim().slice(0, 60) : "";
      if (!isValidDayKey(date) || !name) continue;
      const icon = typeof item.icon === "string" ? item.icon.slice(0, 40) : null;
      const completed = Boolean(item.completed);
      await prisma.habit.upsert({
        where: { guestId_date_name: { guestId, date, name } },
        create: { guestId, date, name, icon, completed },
        update: { completed, icon },
      });
      counts.habits += 1;
    }

    const existingChat = await prisma.chatHistory.count({ where: { guestId } });
    if (existingChat === 0) {
      const messages = asArray(backup.chat)
        .filter(
          (item) =>
            typeof item.content === "string" &&
            (item.role === "user" || item.role === "assistant"),
        )
        .map((item) => ({
          guestId,
          role: item.role as string,
          content: (item.content as string).slice(0, 100_000),
          createdAt: parseDate(item.createdAt),
        }));

      if (messages.length > 0) {
        await prisma.chatHistory.createMany({ data: messages });
        counts.chat = messages.length;
      }
    }

    return NextResponse.json({ ok: true, imported: counts, chatSkipped: existingChat > 0 });
  });
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => !!item && typeof item === "object",
  );
}

function parseDate(value: unknown): Date {
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
