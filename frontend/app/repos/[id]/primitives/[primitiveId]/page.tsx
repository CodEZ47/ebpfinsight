"use client";

import Link from "next/link";
import React from "react";

import { getApiBase } from "@/libs/apiBase";

const numberFormatter = new Intl.NumberFormat();

const sectionSurface =
  "flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20";
const cardSurface =
  "rounded-3xl border border-emerald-100 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20";
const tableSurface =
  "flex flex-col rounded-3xl border border-emerald-100 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/60";
const tableHeaderSurface =
  "flex flex-wrap items-center justify-between gap-3 border-b border-emerald-50 bg-emerald-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60";
const tableInput =
  "w-40 rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40";
const tableStats =
  "flex items-center justify-between px-4 pb-2 text-xs font-medium text-slate-500 dark:text-slate-400";
const tableBase =
  "min-w-full divide-y divide-emerald-50 text-left text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300";
const tableHeading =
  "bg-white/40 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-slate-900/50 dark:text-emerald-300";
const tableRow = "transition hover:bg-emerald-50/60 dark:hover:bg-slate-900";

function SectionTable({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const [query, setQuery] = React.useState("");

  const entries = React.useMemo(() => {
    const all = Object.entries(data || {});
    const filtered = query
      ? all.filter(([key]) => key.toLowerCase().includes(query.toLowerCase()))
      : all;
    return filtered.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [data, query]);

  const totals = React.useMemo(() => {
    const total = Object.values(data || {}).reduce(
      (accumulator, value) => accumulator + Number(value || 0),
      0
    );
    const unique = Object.keys(data || {}).length;
    return { total, unique };
  }, [data]);

  return (
    <div className={tableSurface}>
      <div className={tableHeaderSurface}>
        <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          {title}
        </h3>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          className={tableInput}
        />
      </div>
      <div className={tableStats}>
        <span>
          Total:{" "}
          <span className="text-slate-700 dark:text-slate-200">
            {numberFormatter.format(totals.total)}
          </span>
        </span>
        <span>
          Unique:{" "}
          <span className="text-slate-700 dark:text-slate-200">
            {numberFormatter.format(totals.unique)}
          </span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className={tableBase}>
          <thead className={tableHeading}>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50 dark:divide-slate-800">
            {entries.map(([key, value]) => (
              <tr key={key} className={tableRow}>
                <td className="px-4 py-2 text-slate-800 dark:text-slate-200">
                  {key}
                </td>
                <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100">
                  {numberFormatter.format(value)}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
                  colSpan={2}
                >
                  No matching results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

export default function PrimitiveDetail({
  params,
}: {
  params: { id: string; primitiveId: string };
}) {
  const { id, primitiveId } = params;
  const [primitive, setPrimitive] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await fetch(
          `${getApiBase()}/repos/primitives/${primitiveId}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (isMounted) {
          setPrimitive(data);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [primitiveId]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:shadow-lg dark:shadow-slate-900/20">
        Loading primitive analysis…
      </div>
    );
  }

  if (!primitive) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-white/80 p-6 text-sm font-medium text-rose-600 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
        Unable to load primitive analysis details right now.
      </div>
    );
  }

  const metricCards = [
    { label: "Total Programs", value: primitive.totalPrograms },
    { label: "Program Types (unique)", value: primitive.totalProgramTypes },
    { label: "Helpers (total)", value: primitive.totalHelpers },
    { label: "Helpers (unique)", value: primitive.uniqueHelpers },
    { label: "Maps (total)", value: primitive.totalMaps },
    { label: "Maps (unique)", value: primitive.uniqueMaps },
    { label: "Attach Points (total)", value: primitive.totalAttachPoints },
    { label: "Attach Points (unique)", value: primitive.uniqueAttachPoints },
  ];

  return (
    <div className="space-y-6">
      <div className={sectionSurface}>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Primitive Analysis Detail
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Explore helpers, maps, and attach coverage extracted from this scan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/repos/${id}/primitives`}
            className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-emerald-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
          >
            ← Back to primitives
          </Link>
          <Link
            href={`/repos/${id}`}
            className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600 dark:border-emerald-500/70 dark:bg-emerald-500/90 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:bg-emerald-500"
          >
            Open repository overview
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((metric) => (
            <div key={metric.label} className={cardSurface}>
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {metric.label}
              </span>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {metric.value == null
                  ? "—"
                  : numberFormatter.format(metric.value)}
              </div>
            </div>
          ))}
          <div className={cardSurface}>
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Analyzed At
            </span>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatDate(primitive.analyzedAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionTable title="Helpers" data={primitive.helpers || {}} />
        <SectionTable title="Maps" data={primitive.mapTypes || {}} />
        <SectionTable
          title="Attach Points"
          data={primitive.attachTypes || {}}
        />
        <SectionTable
          title="Program Sections (SEC)"
          data={(primitive.programSections || {}).sec_full || {}}
        />
        <SectionTable
          title="Program Types"
          data={primitive.programTypesInferred || {}}
        />
        <SectionTable
          title="Program Type Tokens"
          data={primitive.programTypesTokens || {}}
        />
      </div>
    </div>
  );
}
