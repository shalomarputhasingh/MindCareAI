"use client";

import { useEffect, useState } from "react";

/**
 * True only after the first client render.
 *
 * Use it to gate anything whose server output can't match the client's — theme
 * toggles, `Notification.permission`, locale-formatted dates.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
