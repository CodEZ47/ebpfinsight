"use client";

import React from "react";

export type SnackbarIntent = "success" | "error" | "info" | "warning";

export interface SnackbarOptions {
  message: string;
  intent?: SnackbarIntent;
  duration?: number; // milliseconds; set Infinity to persist until dismissed
}

interface SnackbarItem extends Required<SnackbarOptions> {
  id: number;
}

interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions) => number;
  dismissSnackbar: (id: number) => void;
}

const SnackbarContext = React.createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<SnackbarItem[]>([]);
  const idRef = React.useRef(0);
  const timers = React.useRef<Map<number, number>>(new Map());

  const dismissSnackbar = React.useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timeoutId = timers.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timers.current.delete(id);
    }
  }, []);

  const showSnackbar = React.useCallback(
    ({
      message,
      intent = "info",
      duration = 4000,
    }: SnackbarOptions): number => {
      idRef.current += 1;
      const id = idRef.current;
      setItems((current) => [...current, { id, message, intent, duration }]);

      if (Number.isFinite(duration) && duration > 0) {
        const timeoutId = window.setTimeout(() => {
          dismissSnackbar(id);
        }, duration);
        timers.current.set(id, timeoutId);
      }

      return id;
    },
    [dismissSnackbar]
  );

  React.useEffect(() => {
    return () => {
      timers.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timers.current.clear();
    };
  }, []);

  const variantStyles: Record<SnackbarIntent, string> = React.useMemo(
    () => ({
      success:
        "bg-green-600 text-white shadow-lg shadow-green-600/20 border border-green-500/40",
      error:
        "bg-red-600 text-white shadow-lg shadow-red-600/20 border border-red-500/40",
      info: "bg-slate-900 text-white shadow-lg shadow-slate-900/20 border border-slate-600/40",
      warning:
        "bg-amber-500 text-white shadow-lg shadow-amber-500/20 border border-amber-400/50",
    }),
    []
  );

  return (
    <SnackbarContext.Provider value={{ showSnackbar, dismissSnackbar }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[2000] flex max-w-sm flex-col gap-3"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`${
              variantStyles[item.intent]
            } pointer-events-auto flex w-full items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-200`}
            role="status"
          >
            <span className="leading-snug">{item.message}</span>
            <button
              type="button"
              onClick={() => dismissSnackbar(item.id)}
              className="ml-2 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:text-white"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = React.useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
}
