/**
 * Shared streaming helpers.
 *
 * Every provider is normalised down to the same thing: a `ReadableStream` of
 * plain UTF-8 text. Nothing downstream of `lib/ai` knows what SSE looks like.
 */

import type { AiError } from "./types";

/** Matches an SSE event boundary: a blank line in any of its legal forms. */
const EVENT_BOUNDARY = /\r\n\r\n|\n\n|\r\r/;

/**
 * Reads an SSE body and yields each `data:` payload as a string.
 *
 * Handles events split across chunk boundaries, all three line-ending styles
 * the spec allows (Gemini uses CRLF, the OpenAI-compatible endpoints use LF),
 * and a final event that arrives without a trailing blank line.
 */
export async function* readSseData(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let match = EVENT_BOUNDARY.exec(buffer);
      while (match) {
        const event = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        yield* dataLines(event);
        match = EVENT_BOUNDARY.exec(buffer);
      }
    }

    // Flush anything the server sent without a closing blank line, which would
    // otherwise silently drop the last (sometimes only) event.
    buffer += decoder.decode();
    if (buffer.trim()) yield* dataLines(buffer);
  } finally {
    reader.releaseLock();
  }
}

function* dataLines(event: string): Generator<string> {
  for (const line of event.split(/\r\n|\n|\r/)) {
    const trimmed = line.trimStart();
    // Lines starting with ":" are keep-alive comments (OpenRouter sends these).
    if (trimmed.startsWith("data:")) {
      const payload = trimmed.slice(5).trim();
      if (payload) yield payload;
    }
  }
}

/** Wraps a text generator in a `ReadableStream` of encoded bytes. */
export function textStream(chunks: AsyncGenerator<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await chunks.next();
        if (done) {
          controller.close();
          return;
        }
        if (value) controller.enqueue(encoder.encode(value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await chunks.return?.(undefined);
    },
  });
}

/**
 * Waits for the first token before handing back a stream.
 *
 * Providers answer 200 and only then report failures inside the SSE body — a
 * bad model id, a spent quota, a safety block. Peeking the first chunk lets
 * those surface as a real error with a real status, instead of a successful
 * response that happens to be empty.
 *
 * `describeEmpty` supplies the reason when the stream ends without any text.
 */
export async function textStreamAfterFirstChunk(
  chunks: AsyncGenerator<string>,
  describeEmpty: () => AiError,
): Promise<ReadableStream<Uint8Array>> {
  let first: string | undefined;

  while (first === undefined) {
    const { done, value } = await chunks.next();
    if (done) break;
    if (value) first = value;
  }

  if (first === undefined) throw describeEmpty();

  return textStream(withPrefix(first, chunks));
}

async function* withPrefix(first: string, rest: AsyncGenerator<string>) {
  yield first;
  yield* rest;
}
