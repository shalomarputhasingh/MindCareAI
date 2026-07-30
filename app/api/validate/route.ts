import { NextResponse } from "next/server";

import { validateKey } from "@/lib/ai";
import { BadRequest, jsonError, readJson } from "@/lib/api";
import { isProvider } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/validate — used by the setup wizard and "Test connection". */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (!isProvider(body.provider)) throw new BadRequest("Choose a provider first.");
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

    const result = await validateKey(body.provider, apiKey);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    if (error instanceof BadRequest) return jsonError(error.message, 400);
    console.error("[api/validate] request failed");
    return jsonError("Couldn't reach the provider. Check your connection.", 502);
  }
}
