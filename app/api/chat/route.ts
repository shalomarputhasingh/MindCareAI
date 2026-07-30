import {
  AiError,
  buildSystemPrompt,
  detectsCrisis,
  sendMessage,
  type AiMessage,
  type LocalContext,
} from "@/lib/ai";
import { BadRequest, jsonError, readJson, requireGuestId } from "@/lib/api";
import { MOOD_OPTIONS } from "@/lib/constants";
import { formatLongDate, shiftDayKey, toDayKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { isProvider } from "@/types";

/** Streaming needs the Node runtime, not the edge. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat
 *
 * The API key arrives with the request from the browser's localStorage, is used
 * for this one call, and is never stored or logged.
 */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);

    if (!isProvider(body.provider)) throw new BadRequest("Choose a provider in Settings.");
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (!apiKey) throw new BadRequest("Add your API key in Settings.");
    const model = typeof body.model === "string" ? body.model.trim() : "";
    if (!model) throw new BadRequest("Choose a model in Settings.");

    const messages = parseMessages(body.messages);
    if (messages.length === 0) throw new BadRequest("Send a message first.");

    // Context is opt-in, and only ever assembled from this device's own data.
    const guestId =
      body.useContext && typeof body.guestId === "string"
        ? requireGuestId(body.guestId)
        : null;
    const context = guestId ? await loadLocalContext(guestId) : undefined;

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const crisis = lastUserMessage ? detectsCrisis(lastUserMessage.content) : false;

    const stream = await sendMessage({
      provider: body.provider,
      apiKey,
      model,
      messages,
      system: buildSystemPrompt({ context, crisis }),
      temperature: clamp(body.temperature, 0, 2, 0.7),
      maxTokens: Math.trunc(clamp(body.maxTokens, 64, 32_000, 1024)),
      signal: request.signal,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        // Tells the client to offer support resources alongside the reply.
        "X-MindCare-Support": crisis ? "1" : "0",
      },
    });
  } catch (error) {
    if (error instanceof BadRequest) return jsonError(error.message, 400);
    if (error instanceof AiError) return jsonError(error.message, error.status);
    // Never echo the raw error — it can contain the request body, key included.
    console.error("[api/chat] request failed");
    return jsonError("Couldn't reach the AI provider. Check your connection.", 502);
  }
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseMessages(value: unknown): AiMessage[] {
  if (!Array.isArray(value)) throw new BadRequest("Messages must be a list.");

  return value
    .filter(
      (item): item is AiMessage =>
        !!item &&
        typeof item === "object" &&
        typeof (item as AiMessage).content === "string" &&
        ((item as AiMessage).role === "user" || (item as AiMessage).role === "assistant"),
    )
    .map((item) => ({ role: item.role, content: item.content.slice(0, 100_000) }))
    // Keep the tail of long conversations rather than failing on context limits.
    .slice(-40);
}

/** Summarises today's local data for the system prompt. */
async function loadLocalContext(guestId: string): Promise<LocalContext | undefined> {
  const today = toDayKey();
  const weekAgo = shiftDayKey(today, -6);

  const [mood, journal, habits, recentMoods] = await Promise.all([
    prisma.mood.findUnique({ where: { guestId_date: { guestId, date: today } } }),
    prisma.journal.findUnique({ where: { guestId_date: { guestId, date: today } } }),
    prisma.habit.findMany({ where: { guestId, date: today } }),
    prisma.mood.findMany({
      where: { guestId, date: { gte: weekAgo } },
      orderBy: { date: "asc" },
    }),
  ]);

  const context: LocalContext = { today: formatLongDate(today) };

  if (mood) {
    context.moodLabel = MOOD_OPTIONS.find((o) => o.score === mood.score)?.label;
  }

  if (recentMoods.length >= 3) {
    const average =
      recentMoods.reduce((sum, entry) => sum + entry.score, 0) / recentMoods.length;
    context.moodTrend = `averaging ${average.toFixed(1)} out of 5 over the last ${recentMoods.length} check-ins`;
  }

  if (habits.length > 0) {
    const done = habits.filter((habit) => habit.completed);
    context.habitsSummary =
      done.length > 0
        ? `${done.length} of ${habits.length} done (${done.map((h) => h.name).join(", ")})`
        : `none of ${habits.length} done yet`;
  }

  if (journal?.content.trim()) {
    // A short excerpt only. The model gets a sense of the day, not the diary.
    const excerpt = journal.content.trim().replace(/\s+/g, " ").slice(0, 600);
    context.journalExcerpt = excerpt.length < journal.content.trim().length
      ? `${excerpt}…`
      : excerpt;
  }

  return context;
}
