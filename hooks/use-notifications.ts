"use client";

import { useCallback, useEffect, useState } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { DEFAULT_NOTIFICATIONS, STORAGE_KEYS } from "@/lib/constants";
import type { NotificationPreferences } from "@/types";

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

/** Never touches `Notification` during render — only inside effects/callbacks. */
function readPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationPermissionState;
}

/**
 * Notification preferences (localStorage, `STORAGE_KEYS.notifications`) plus
 * the browser's live permission state.
 *
 * Shared by the settings toggle card and `<NotificationScheduler />`. Safe to
 * call anywhere: it never reads `Notification` or `window` during the first
 * render, so it can't cause a hydration mismatch.
 */
export function useNotifications() {
  const {
    value: preferences,
    setValue,
    hydrated,
  } = useLocalStorage<NotificationPreferences>(STORAGE_KEYS.notifications, DEFAULT_NOTIFICATIONS);

  const [permission, setPermission] = useState<NotificationPermissionState>("unsupported");

  useEffect(() => {
    setPermission(readPermission());
  }, []);

  const update = useCallback(
    (patch: Partial<NotificationPreferences>) =>
      setValue((current) => ({ ...current, ...patch })),
    [setValue],
  );

  /** Prompts the browser's own permission dialog; resolves once the user answers. */
  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const result = (await Notification.requestPermission()) as NotificationPermissionState;
      setPermission(result);
      return result;
    } catch {
      const current = readPermission();
      setPermission(current);
      return current;
    }
  }, []);

  return {
    preferences: { ...DEFAULT_NOTIFICATIONS, ...preferences },
    update,
    hydrated,
    permission,
    requestPermission,
    supported: permission !== "unsupported",
  };
}
