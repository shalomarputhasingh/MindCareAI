import { NextResponse } from "next/server";

import { AiError, listModels } from "@/lib/ai";
import { BadRequest, jsonError, readJson } from "@/lib/api";
import { isProvider } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/models — fetches the provider's live catalogue.
 *
 * A POST rather than a GET because the API key travels in the body; keys in a
 * query string end up in logs and browser history.
 */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (!isProvider(body.provider)) throw new BadRequest("Choose a provider first.");
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (!apiKey) throw new BadRequest("Enter an API key first.");

    const models = await listModels(body.provider, apiKey);
    return NextResponse.json({ models });
  } catch (error) {
    if (error instanceof BadRequest) return jsonError(error.message, 400);
    if (error instanceof AiError) return jsonError(error.message, error.status);
    console.error("[api/models] request failed");
    return jsonError("Couldn't reach the provider. Check your connection.", 502);
  }
}
