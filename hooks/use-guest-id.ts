"use client";

import { useEffect, useState } from "react";

import { getGuestId } from "@/lib/guest";

/**
 * This browser's guest id, or `null` until it has been read on the client.
 *
 * Every data fetch is scoped by this id, so callers should skip fetching while
 * it is null rather than falling back to a placeholder.
 */
export function useGuestId(): string | null {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    setGuestId(getGuestId());
  }, []);

  return guestId;
}
