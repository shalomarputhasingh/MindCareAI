import { STORAGE_KEYS } from "@/lib/constants";

const GUEST_ID_PATTERN = /^guest_[a-z0-9]{9}$/;

function createGuestId(): string {
  // `guest_` plus 9 lowercase alphanumeric characters, derived from a UUID so we
  // don't depend on Math.random for identity.
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 9);
  return `guest_${suffix}`;
}

/**
 * Returns this browser's guest id, creating and persisting one on first call.
 *
 * Client-side only — there are no accounts, so the id lives in localStorage and
 * is the sole scope for every piece of stored data.
 */
export function getGuestId(): string {
  if (typeof window === "undefined") {
    throw new Error("getGuestId() is client-only; call it from a client component.");
  }

  const existing = window.localStorage.getItem(STORAGE_KEYS.guestId);
  if (existing && GUEST_ID_PATTERN.test(existing)) {
    return existing;
  }

  const created = createGuestId();
  window.localStorage.setItem(STORAGE_KEYS.guestId, created);
  return created;
}

/** Validates ids arriving at a route handler before they reach a query. */
export function isValidGuestId(value: unknown): value is string {
  return typeof value === "string" && GUEST_ID_PATTERN.test(value);
}
