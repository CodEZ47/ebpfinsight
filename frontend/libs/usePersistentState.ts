"use client";

import React from "react";

export function usePersistentState<T>(storageKey: string, defaultValue: T) {
  const [value, setValue] = React.useState<T>(defaultValue);
  const [loaded, setLoaded] = React.useState(false);
  const defaultRef = React.useRef(defaultValue);

  React.useEffect(() => {
    defaultRef.current = defaultValue;
  }, [defaultValue]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      setLoaded(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) {
        setValue(() => {
          try {
            return JSON.parse(raw) as T;
          } catch (_error) {
            return defaultRef.current;
          }
        });
      }
    } catch (_error) {
      // Ignore storage access issues and fall back to default value.
    } finally {
      setLoaded(true);
    }
  }, [storageKey]);

  React.useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (_error) {
      // Ignore persistence errors (e.g., private mode quota issues).
    }
  }, [storageKey, value, loaded]);

  return [value, setValue, loaded] as const;
}
