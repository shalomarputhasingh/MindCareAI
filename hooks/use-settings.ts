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

  /** Patches the nested voice block without disturbing the rest of settings. */
  const updateVoice = useCallback(
    (patch: Partial<AppSettings["voice"]>) =>
      setValue((current) => ({
        ...current,
        voice: { ...DEFAULT_SETTINGS.voice, ...current?.voice, ...patch },
      })),
    [setValue],
  );

  const reset = useCallback(() => setValue(DEFAULT_SETTINGS), [setValue]);

  // Merged so settings saved by an older build still get new defaults. `voice`
  // is merged a level deeper, or a stored object written before it existed
  // would leave its fields undefined.
  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...value,
    voice: { ...DEFAULT_SETTINGS.voice, ...value?.voice },
  };

  return {
    settings,
    update,
    updateVoice,
    reset,
    hydrated,
    /** True once a provider, key and model are all present. */
    isConfigured: Boolean(settings.provider && settings.apiKey && settings.model),
  };
}
