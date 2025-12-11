"use client";
import React from "react";

export default function ThemeToggle() {
  const [dark, setDark] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    window.localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400"
      aria-label="Toggle dark mode"
    >
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
