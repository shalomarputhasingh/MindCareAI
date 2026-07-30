import { NextResponse } from "next/server";

import { isValidDayKey, toDayKey } from "@/lib/date";
import { isValidGuestId } from "@/lib/guest";

/**
 * Shared plumbing for route handlers.
 *
 * There is no auth, so validation is the only thing standing between a
 * malformed request and a database query. Every handler runs its input through
 * here first.
 */

export class BadRequest extends Error {}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wraps a handler so thrown errors become tidy JSON instead of stack traces. */
export function handle<T>(fn: () => Promise<T>) {
  return fn().catch((error: unknown) => {
    if (error instanceof BadRequest) return jsonError(error.message, 400);
    console.error("[api]", error);
    return jsonError("Something went wrong reading local data.", 500);
  });
}

export function requireGuestId(value: unknown): string {
  if (!isValidGuestId(value)) throw new BadRequest("A valid guest id is required.");
  return value;
}

export function requireDayKey(value: unknown, fallbackToToday = false): string {
  if (value == null && fallbackToToday) return toDayKey();
  if (!isValidDayKey(value)) throw new BadRequest("A valid date (YYYY-MM-DD) is required.");
  return value;
}

export function requireString(value: unknown, field: string, maxLength = 20_000): string {
  if (typeof value !== "string") throw new BadRequest(`${field} must be text.`);
  if (value.length > maxLength) {
    throw new BadRequest(`${field} is too long (limit ${maxLength} characters).`);
  }
  return value;
}

export function requireInt(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BadRequest(`${field} must be a whole number between ${min} and ${max}.`);
  }
  return parsed;
}

export function optionalBoundedInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

/** Words in a journal entry, counted the way a person would count them. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new BadRequest("The request body must be JSON.");
  }
}
