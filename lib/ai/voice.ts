import type { Provider } from "@/types";

import { AiError, describeHttpError } from "./types";

/**
 * Speech to text, routed by provider — the transcription counterpart to
 * `sendMessage`. Callers hand over audio and get back words.
 *
 * Only Groq and Gemini can do this. OpenRouter is a chat-completions router
 * with no general transcription endpoint, so the UI falls back to the browser's
 * own recogniser there rather than pretending the feature is missing.
 */

/** Groq's Whisper deployment. Fast, cheap, and good with hesitant speech. */
const GROQ_TRANSCRIBE_MODEL = "whisper-large-v3-turbo";

export function supportsTranscription(provider: Provider): boolean {
  return provider === "groq" || provider === "gemini";
}

export interface TranscribeRequest {
  provider: Provider;
  apiKey: string;
  audio: Blob;
  /** Provider chat model, used by Gemini which transcribes with its own model. */
  model?: string;
  signal?: AbortSignal;
}

export async function transcribe(request: TranscribeRequest): Promise<string> {
  if (request.audio.size === 0) {
    throw new AiError("That recording was empty.", 400, request.provider);
  }

  switch (request.provider) {
    case "groq":
      return transcribeGroq(request);
    case "gemini":
      return transcribeGemini(request);
    default:
      throw new AiError(
        "OpenRouter doesn't offer speech to text. Switch to Groq or Gemini in Settings, or use your browser's own dictation.",
        400,
        request.provider,
      );
  }
}

/** Whisper needs a filename whose extension matches the audio it's given. */
function fileNameFor(mimeType: string): string {
  const base = mimeType.split(";")[0].trim();
  const extensions: Record<string, string> = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/flac": "flac",
  };
  return `speech.${extensions[base] ?? "webm"}`;
}

async function transcribeGroq({ apiKey, audio, signal }: TranscribeRequest) {
  const form = new FormData();
  // MediaRecorder produces WebM/Opus on Chrome and MP4/AAC on Safari, so the
  // type is read off the blob rather than assumed.
  form.append("file", audio, fileNameFor(audio.type || "audio/webm"));
  form.append("model", GROQ_TRANSCRIBE_MODEL);
  form.append("response_format", "json");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    // No Content-Type header: fetch must set the multipart boundary itself.
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal,
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      detail = body?.error?.message;
    } catch {
      // Non-JSON error body.
    }
    throw describeHttpError(response.status, "groq", detail);
  }

  const body = (await response.json()) as { text?: string };
  return (body.text ?? "").trim();
}

async function transcribeGemini({ apiKey, audio, model, signal }: TranscribeRequest) {
  const base64 = await blobToBase64(audio);
  const chatModel = model?.replace(/^models\//, "") || "gemini-2.0-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      chatModel,
    )}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Transcribe this audio exactly as spoken. Return only the transcription, with no commentary, labels or quotation marks. If there is no intelligible speech, return nothing at all.",
              },
              {
                inline_data: {
                  mime_type: (audio.type || "audio/webm").split(";")[0].trim(),
                  data: base64,
                },
              },
            ],
          },
        ],
        // Deterministic: this is transcription, not composition.
        generationConfig: { temperature: 0 },
      }),
      signal,
    },
  );

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      detail = body?.error?.message;
    } catch {
      // Non-JSON error body.
    }
    throw describeHttpError(response.status, "gemini", detail);
  }

  const body = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  };

  const text = (body.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  return text;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
