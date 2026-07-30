import type { Provider } from "@/types";

/** A message as the AI service sees it. `system` is passed separately. */
export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiRequest {
  provider: Provider;
  apiKey: string;
  model: string;
  messages: AiMessage[];
  /** System instruction. Each provider places this differently. */
  system?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

/**
 * Every provider failure is normalised to this, so the UI can show something
 * useful without knowing which API was called.
 */
export class AiError extends Error {
  readonly status: number;
  readonly provider: Provider;

  constructor(message: string, status: number, provider: Provider) {
    super(message);
    this.name = "AiError";
    this.status = status;
    this.provider = provider;
  }
}

/** Turns an HTTP failure into wording a person can act on. */
export function describeHttpError(
  status: number,
  provider: Provider,
  detail?: string,
): AiError {
  const messages: Record<number, string> = {
    400: detail || "The request was rejected. Try a different model.",
    401: "That API key was rejected. Check it in Settings.",
    403: "That key doesn't have access to this model.",
    404: "That model no longer exists. Pick another one in Settings.",
    408: "The provider took too long to respond. Try again.",
    413: "This conversation is too long for the selected model. Clear it and start fresh.",
    429: "You've hit the provider's rate limit. Wait a moment and try again.",
    500: "The provider had an internal error. Try again shortly.",
    502: "The provider is unreachable right now. Try again shortly.",
    503: "The provider is temporarily overloaded. Try again shortly.",
  };

  if (status === 402) {
    return new AiError(
      "This model needs credit on your provider account.",
      status,
      provider,
    );
  }

  return new AiError(
    messages[status] ?? detail ?? `The provider returned an error (${status}).`,
    status,
    provider,
  );
}
