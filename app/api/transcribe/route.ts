import { NextResponse } from "next/server";

import { AiError, transcribe } from "@/lib/ai";
import { BadRequest, jsonError } from "@/lib/api";
import { isProvider } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Well past a minute of speech at typical Opus bitrates. */
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

/**
 * POST /api/transcribe — multipart: `audio`, `provider`, `apiKey`, `model`.
 *
 * The one route in this app that forwards the user's own voice off the machine,
 * and only when they've switched cloud transcription on. Like `/api/chat`, the
 * key arrives per request, is used once, and is never stored or logged — and
 * the audio is never written to disk.
 */
export async function POST(request: Request) {
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new BadRequest("Send the recording as multipart form data.");
    }

    const provider = form.get("provider");
    if (!isProvider(provider)) throw new BadRequest("Choose a provider in Settings.");

    const apiKey = String(form.get("apiKey") ?? "").trim();
    if (!apiKey) throw new BadRequest("Add your API key in Settings.");

    const audio = form.get("audio");
    if (!(audio instanceof Blob)) throw new BadRequest("No recording was attached.");
    if (audio.size === 0) throw new BadRequest("That recording was empty.");
    if (audio.size > MAX_AUDIO_BYTES) {
      throw new BadRequest("That recording is too long. Try again in shorter pieces.");
    }

    const model = String(form.get("model") ?? "").trim() || undefined;

    // A two-letter ISO-639-1 hint and nothing else — this is interpolated into
    // a prompt on the Gemini path, so it is validated by shape, not trusted.
    const raw = String(form.get("language") ?? "").trim().toLowerCase();
    const language = /^[a-z]{2}$/.test(raw) ? raw : undefined;

    const text = await transcribe({
      provider,
      apiKey,
      audio,
      model,
      language,
      signal: request.signal,
    });

    if (!text) {
      return jsonError("Nothing was picked up. Try again, a little closer to the mic.", 422);
    }

    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof BadRequest) return jsonError(error.message, 400);
    if (error instanceof AiError) {
      const status =
        Number.isInteger(error.status) && error.status >= 400 && error.status <= 599
          ? error.status
          : 502;
      return jsonError(error.message, status);
    }
    // Never echo the raw error — the request carried the API key.
    console.error("[api/transcribe] request failed");
    return jsonError("Couldn't reach the provider to transcribe that.", 502);
  }
}
