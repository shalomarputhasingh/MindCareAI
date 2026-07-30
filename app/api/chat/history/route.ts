import { NextResponse } from "next/server";

import {
  handle,
  optionalBoundedInt,
  readJson,
  requireGuestId,
  requireString,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";

/** GET /api/chat/history?guestId=…&limit=200 — oldest first, ready to render. */
export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const guestId = requireGuestId(params.get("guestId"));
    const limit = optionalBoundedInt(params.get("limit"), 200, 1, 1000);

    // Take the most recent N, then flip so the conversation reads forwards.
    const recent = await prisma.chatHistory.findMany({
      where: { guestId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ messages: recent.reverse() });
  });
}

/** POST /api/chat/history — append one message to the local log. */
export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const guestId = requireGuestId(body.guestId);
    const content = requireString(body.content, "Message", 100_000);
    const role = body.role === "assistant" ? "assistant" : "user";

    const message = await prisma.chatHistory.create({
      data: { guestId, role, content },
    });

    return NextResponse.json({ message });
  });
}

/** DELETE /api/chat/history?guestId=… — clears the conversation. */
export async function DELETE(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const guestId = requireGuestId(params.get("guestId"));

    await prisma.chatHistory.deleteMany({ where: { guestId } });
    return NextResponse.json({ ok: true });
  });
}
