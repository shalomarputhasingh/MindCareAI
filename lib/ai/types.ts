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

/**
 * Explains a stream that finished without producing any text.
 *
 * This is common enough to deserve real wording: reasoning models can spend
 * their whole token budget thinking and never reach an answer, and safety
 * filters drop replies after the request has already succeeded. "Empty reply"
 * on its own tells the person nothing they can act on.
 */
export function emptyReplyError(provider: Provider, reason?: string | null): AiError {
  const normalised = reason?.toUpperCase();

  if (normalised === "LENGTH" || normalised === "MAX_TOKENS") {
    return new AiError(
      "The model used its entire token budget before writing a reply. Raise Max tokens in Settings, or pick a model that doesn't reason as long.",
      502,
      provider,
    );
  }

  if (
    normalised === "CONTENT_FILTER" ||
    normalised === "SAFETY" ||
    normalised === "BLOCKLIST" ||
    normalised === "PROHIBITED_CONTENT"
  ) {
    return new AiError(
      "The provider's safety filter stopped this reply. Rephrasing usually helps, and the Emergency Support page is there if you need it.",
      502,
      provider,
    );
  }

  if (normalised === "RECITATION") {
    return new AiError(
      "The provider blocked this reply for quoting its training data too closely. Try asking a different way.",
      502,
      provider,
    );
  }

  return new AiError(
    "The model returned an empty reply. Try again, or choose a different model in Settings.",
    502,
    provider,
  );
}
