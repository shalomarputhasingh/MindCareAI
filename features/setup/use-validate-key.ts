"use client";

import { useCallback, useState } from "react";

import { ApiError, providerApi } from "@/lib/api-client";
import type { Provider } from "@/types";

export type ValidateStatus = "idle" | "pending" | "success" | "error";

type ValidateResult =
  | { ok: true; modelCount: number }
  | { ok: false; error: string };

/**
 * Validates a provider key against `/api/validate`.
 *
 * Shared by the wizard's Validate step and the settings page's "Test
 * connection" button. `validate` resolves with the fresh result directly
 * (rather than making callers read back the hook's own state), since the
 * state setters it also calls don't apply until the next render.
 */
export function useValidateKey() {
  const [status, setStatus] = useState<ValidateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [modelCount, setModelCount] = useState<number | null>(null);

  const validate = useCallback(
    async (provider: Provider, apiKey: string): Promise<ValidateResult> => {
      setStatus("pending");
      setError(null);
      try {
        const result = await providerApi.validate(provider, apiKey);
        setStatus("success");
        setModelCount(result.modelCount);
        return { ok: true, modelCount: result.modelCount };
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Couldn't validate that key.";
        setStatus("error");
        setModelCount(null);
        setError(message);
        return { ok: false, error: message };
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setModelCount(null);
  }, []);

  return { status, error, modelCount, validate, reset };
}
