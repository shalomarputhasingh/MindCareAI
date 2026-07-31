import type { AiModel, Provider } from "@/types";

import { listModelsGemini, streamGemini } from "./gemini";
import {
  GROQ,
  OPENROUTER,
  listModelsOpenAi,
  streamOpenAi,
} from "./openai-compatible";
import { AiError, type AiRequest } from "./types";

export { AiError } from "./types";
export type { AiMessage, AiRequest } from "./types";
export { buildSystemPrompt, type LocalContext } from "./system-prompt";
export { detectsCrisis } from "./safety";
export { supportsTranscription, transcribe, type TranscribeRequest } from "./voice";

/**
 * The unified AI service.
 *
 * Everything above `lib/ai` calls these three functions and never learns which
 * provider is in use. Adding a provider means adding a case here and nothing
 * else changes.
 */

/** Streams a reply as plain UTF-8 text. */
export function sendMessage(request: AiRequest): Promise<ReadableStream<Uint8Array>> {
  switch (request.provider) {
    case "openrouter":
      return streamOpenAi(OPENROUTER, request);
    case "groq":
      return streamOpenAi(GROQ, request);
    case "gemini":
      return streamGemini(request);
    default:
      return Promise.reject(
        new AiError("Unknown provider.", 400, request.provider),
      );
  }
}

/** Fetches the provider's live model catalogue. Never hardcoded. */
export function listModels(provider: Provider, apiKey: string): Promise<AiModel[]> {
  switch (provider) {
    case "openrouter":
      return listModelsOpenAi(OPENROUTER, apiKey);
    case "groq":
      return listModelsOpenAi(GROQ, apiKey);
    case "gemini":
      return listModelsGemini(apiKey);
    default:
      return Promise.reject(new AiError("Unknown provider.", 400, provider));
  }
}

/**
 * Checks a key by asking for the model list — the cheapest authenticated call
 * every provider supports.
 */
export async function validateKey(
  provider: Provider,
  apiKey: string,
): Promise<{ ok: true; modelCount: number } | { ok: false; error: string }> {
  if (!apiKey.trim()) {
    return { ok: false, error: "Enter an API key first." };
  }

  try {
    const models = await listModels(provider, apiKey);
    if (models.length === 0) {
      return { ok: false, error: "The key worked, but no usable models came back." };
    }
    return { ok: true, modelCount: models.length };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: error.message };
    return { ok: false, error: "Couldn't reach the provider. Check your connection." };
  }
}
