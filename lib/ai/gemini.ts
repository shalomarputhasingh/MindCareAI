import type { AiModel } from "@/types";

import { readSseData, textStreamAfterFirstChunk } from "./stream";
import { AiError, describeHttpError, emptyReplyError, type AiRequest } from "./types";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiModel {
  name: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

async function failure(response: Response) {
  let detail: string | undefined;
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    detail = body?.error?.message;
  } catch {
    // Non-JSON error body.
  }
  return describeHttpError(response.status, "gemini", detail);
}

/** Gemini prefixes ids with `models/`; the rest of the app uses the bare id. */
function stripPrefix(name: string) {
  return name.startsWith("models/") ? name.slice("models/".length) : name;
}

export async function listModelsGemini(apiKey: string): Promise<AiModel[]> {
  const response = await fetch(`${BASE_URL}/models?pageSize=200`, {
    headers: { "x-goog-api-key": apiKey },
    cache: "no-store",
  });

  if (!response.ok) throw await failure(response);

  const body = (await response.json()) as { models?: GeminiModel[] };

  return (body.models ?? [])
    // The catalogue includes embedding and tuning models that can't chat.
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => ({
      id: stripPrefix(model.name),
      label: model.displayName ?? stripPrefix(model.name),
      contextLength: model.inputTokenLimit,
      description: model.description,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function streamGemini(
  request: AiRequest,
): Promise<ReadableStream<Uint8Array>> {
  return start();

  async function start() {
    const model = stripPrefix(request.model);

    const response = await fetch(
      `${BASE_URL}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": request.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: request.messages.map((message) => ({
            // Gemini calls the assistant "model".
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
          ...(request.system
            ? { systemInstruction: { parts: [{ text: request.system }] } }
            : {}),
          generationConfig: {
            temperature: request.temperature,
            maxOutputTokens: request.maxTokens,
          },
        }),
        signal: request.signal,
      },
    );

    if (!response.ok || !response.body) throw await failure(response);

    const state: { finishReason: string | null } = { finishReason: null };

    return textStreamAfterFirstChunk(parse(response.body, state), () =>
      emptyReplyError("gemini", state.finishReason),
    );
  }

  async function* parse(
    body: ReadableStream<Uint8Array>,
    state: { finishReason: string | null },
  ) {
    for await (const data of readSseData(body)) {
      let chunk: {
        error?: { message?: string; code?: number };
        promptFeedback?: { blockReason?: string };
        candidates?: {
          content?: { parts?: { text?: string; thought?: boolean }[] };
          finishReason?: string;
        }[];
      };

      try {
        chunk = JSON.parse(data);
      } catch {
        continue;
      }

      if (chunk.error) {
        throw new AiError(
          chunk.error.message ?? "Gemini stopped the reply.",
          chunk.error.code ?? 502,
          "gemini",
        );
      }

      // The prompt itself was refused before any candidate was produced.
      if (chunk.promptFeedback?.blockReason) {
        throw emptyReplyError("gemini", chunk.promptFeedback.blockReason);
      }

      const candidate = chunk.candidates?.[0];
      if (candidate?.finishReason) state.finishReason = candidate.finishReason;

      for (const part of candidate?.content?.parts ?? []) {
        // 2.5-series models stream their reasoning as parts flagged `thought`.
        // Those are not the answer and must not be shown as one.
        if (part.thought) continue;
        if (part.text) yield part.text;
      }
    }
  }
}
