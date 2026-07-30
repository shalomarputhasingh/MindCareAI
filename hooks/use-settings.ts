"use client";

import { useCallback } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "@/lib/constants";
import type { AppSettings } from "@/types";

/**
 * The app's settings, kept in localStorage.
 *
 * `hydrated` is false on the first render because localStorage can't be read on
 * the server. Anything that would redirect an un-onboarded user, or show an
 * "add your key" prompt, must wait for it — otherwise it flashes for everyone.
 */
export function useSettings() {
  const { value, setValue, hydrated } = useLocalStorage<AppSettings>(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS,
  );

  const update = useCallback(
    (patch: Partial<AppSettings>) => setValue((current) => ({ ...current, ...patch })),
    [setValue],
  );

  const reset = useCallback(() => setValue(DEFAULT_SETTINGS), [setValue]);

  // Merged so settings saved by an older build still get new defaults.
  const settings: AppSettings = { ...DEFAULT_SETTINGS, ...value };

  return {
    settings,
    update,
    reset,
    hydrated,
    /** True once a provider, key and model are all present. */
    isConfigured: Boolean(settings.provider && settings.apiKey && settings.model),
  };
}
