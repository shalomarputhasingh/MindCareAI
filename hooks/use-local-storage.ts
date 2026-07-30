"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Reads and writes a JSON value in localStorage.
 *
 * The first render always returns `fallback` so the server and client markup
 * agree; the stored value is read in an effect and `hydrated` flips to true.
 * Consumers that would flash the wrong content should wait on `hydrated`.
 *
 * Values stay in sync across tabs via the `storage` event.
 */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readStorage(key, fallback));
    setHydrated(true);
    // `fallback` is intentionally not a dependency: it is often an inline
    // literal, and re-reading on every render would defeat the purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== key) return;
      setValue(readStorage(key, fallback));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved =
          typeof next === "function" ? (next as (current: T) => T)(current) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Quota exceeded or storage disabled — keep the in-memory value so the
          // session still works, just without persistence.
        }
        return resolved;
      });
    },
    [key],
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setValue(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { value, setValue: update, remove, hydrated } as const;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt or non-JSON entry — fall back rather than crashing the tree.
    return fallback;
  }
}
