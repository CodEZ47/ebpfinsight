"use client";
import React from "react";
import clsx from "clsx";

export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-3xl border border-emerald-100 bg-white/80 shadow-lg shadow-emerald-100/40 backdrop-blur dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between rounded-t-3xl border-b border-emerald-100/60 bg-white/70 px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
          {title && (
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              {title}
            </h3>
          )}
          {actions && <div>{actions}</div>}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export const CHART_PALETTE = [
  "#0D4D92",
  "#2563eb",
  "#9333ea",
  "#dc2626",
  "#059669",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#84cc16",
];

export function StatGrid({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((i) => (
        <div
          key={String(i.label)}
          className="flex flex-col rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <span className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            {i.label}
          </span>
          <span className="mt-2 text-sm font-semibold text-slate-900 dark:text-gray-100">
            {i.value}
          </span>
        </div>
      ))}
    </div>
  );
}
