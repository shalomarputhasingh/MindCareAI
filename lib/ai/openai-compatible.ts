import type { AiModel, Provider } from "@/types";

import { readSseData, textStream } from "./stream";
import { describeHttpError, type AiRequest } from "./types";

/**
 * OpenRouter and Groq both speak the OpenAI chat-completions dialect, so they
 * share one implementation and differ only in base URL and extra headers.
 */
interface Endpoint {
  provider: Provider;
  baseUrl: string;
  extraHeaders?: Record<string, string>;
}

interface OpenAiModel {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  context_window?: number;
}

async function failure(response: Response, provider: Provider) {
  let detail: string | undefined;
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    detail = body?.error?.message;
  } catch {
    // Non-JSON error body; the status alone will have to do.
  }
  return describeHttpError(response.status, provider, detail);
}

export async function listModelsOpenAi(
  endpoint: Endpoint,
  apiKey: string,
): Promise<AiModel[]> {
  const response = await fetch(`${endpoint.baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...endpoint.extraHeaders,
    },
    cache: "no-store",
  });

  if (!response.ok) throw await failure(response, endpoint.provider);

  const body = (await response.json()) as { data?: OpenAiModel[] };

  return (body.data ?? [])
    .map((model) => ({
      id: model.id,
      label: model.name ?? model.id,
      contextLength: model.context_length ?? model.context_window,
      description: model.description,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function streamOpenAi(
  endpoint: Endpoint,
  request: AiRequest,
): Promise<ReadableStream<Uint8Array>> {
  return start();

  async function start() {
    const messages = [
      ...(request.system ? [{ role: "system", content: request.system }] : []),
      ...request.messages,
    ];

    const response = await fetch(`${endpoint.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        "Content-Type": "application/json",
        ...endpoint.extraHeaders,
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: true,
      }),
      signal: request.signal,
    });

    if (!response.ok || !response.body) {
      throw await failure(response, endpoint.provider);
    }

    return textStream(parse(response.body));
  }

  async function* parse(body: ReadableStream<Uint8Array>) {
    for await (const data of readSseData(body)) {
      if (data === "[DONE]") return;
      try {
        const chunk = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        // Keep-alive comments and partial frames are safe to skip.
      }
    }
  }
}

export const OPENROUTER: Endpoint = {
  provider: "openrouter",
  baseUrl: "https://openrouter.ai/api/v1",
  extraHeaders: {
    // OpenRouter attributes requests to an app; these are cosmetic but expected.
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "MindCareAI",
  },
};

export const GROQ: Endpoint = {
  provider: "groq",
  baseUrl: "https://api.groq.com/openai/v1",
};
