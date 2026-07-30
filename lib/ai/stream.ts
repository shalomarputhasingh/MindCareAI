/**
 * Shared streaming helpers.
 *
 * Every provider is normalised down to the same thing: a `ReadableStream` of
 * plain UTF-8 text. Nothing downstream of `lib/ai` knows what SSE looks like.
 */

/**
 * Reads an SSE body and yields each `data:` payload as a string.
 * Handles events split across chunk boundaries.
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

      // SSE events are separated by a blank line; a chunk may end mid-event.
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        for (const line of event.split("\n")) {
          const trimmed = line.trimStart();
          if (trimmed.startsWith("data:")) {
            yield trimmed.slice(5).trim();
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
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
