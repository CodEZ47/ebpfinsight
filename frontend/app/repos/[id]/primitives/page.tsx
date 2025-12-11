"use client";
import Link from "next/link";
import React from "react";
import { getApiBase } from "@/libs/apiBase";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

const sectionSurface =
  "flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20";
const formSurface =
  "rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20";
const tableShell =
  "overflow-hidden rounded-3xl border border-emerald-100 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/60";
const tableBase =
  "min-w-full divide-y divide-emerald-100 text-left text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300";
const tableHeading =
  "bg-emerald-50/70 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-slate-900/60 dark:text-emerald-300";
const tableRow = "transition hover:bg-emerald-50/50 dark:hover:bg-slate-900";
const tableCell = "px-4 py-3";
const tableCellHighlight =
  "px-4 py-3 font-medium text-slate-900 dark:text-slate-100";

export default function RepoPrimitives({ params }: { params: { id: string } }) {
  const { id } = params;
  const [rows, setRows] = React.useState<any[]>([]);
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  React.useEffect(() => {
    (async () => {
      const res = await fetch(`${getApiBase()}/repos/${id}/primitives`, {
        cache: "no-store",
      });
      const data = await res.json();
      setRows(data || []);
    })();
  }, [id]);

  const filtered = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    const fromTs = from ? Date.parse(from) : undefined;
    const toTs = to ? Date.parse(to) : undefined;
    return rows.filter((p) => {
      const ts = Date.parse(p.analyzedAt);
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (!ql) return true;
      const hay = [
        JSON.stringify(p.helpersRaw || {}),
        JSON.stringify(p.mapsRaw || {}),
        JSON.stringify(p.attachRaw || {}),
        JSON.stringify(p.programTypesRaw || {}),
        JSON.stringify(p.programTypesTokensRaw || {}),
        JSON.stringify(p.sectionsRaw || {}),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(ql);
    });
  }, [rows, q, from, to]);

  return (
    <div className="space-y-6">
      <div className={sectionSurface}>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Primitive Analyses
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Inspect helper usage, attach points, and map coverage trends for
            this repository.
          </p>
        </div>
        <Link
          href={`/repos/${id}`}
          className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600"
        >
          ← Back to overview
        </Link>
      </div>

      <form className={formSurface}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            Search
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="helpers, maps, attach, tokens..."
              className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
            />
          </label>
        </div>
      </form>

      <div className={tableShell}>
        <div className="overflow-x-auto">
          <table className={tableBase}>
            <thead className={tableHeading}>
              <tr>
                <th className={tableCell}>Total Programs</th>
                <th className={tableCell}>Program Types (unique)</th>
                <th className={tableCell}>Helpers (total)</th>
                <th className={tableCell}>Helpers (unique)</th>
                <th className={tableCell}>Maps (total)</th>
                <th className={tableCell}>Maps (unique)</th>
                <th className={tableCell}>Attach Points (total)</th>
                <th className={tableCell}>Attach Points (unique)</th>
                <th className={tableCell}>Analyzed At</th>
                <th className={tableCell} aria-label="actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 dark:divide-slate-800">
              {filtered.map((p: any) => (
                <tr key={p.id} className={tableRow}>
                  <td className={tableCellHighlight}>
                    {p.totalPrograms ?? "—"}
                  </td>
                  <td className={tableCell}>{p.totalProgramTypes ?? "—"}</td>
                  <td className={tableCell}>{p.totalHelpers ?? "—"}</td>
                  <td className={tableCell}>{p.uniqueHelpers ?? "—"}</td>
                  <td className={tableCell}>{p.totalMaps ?? "—"}</td>
                  <td className={tableCell}>{p.uniqueMaps ?? "—"}</td>
                  <td className={tableCell}>{p.totalAttachPoints ?? "—"}</td>
                  <td className={tableCell}>{p.uniqueAttachPoints ?? "—"}</td>
                  <td className={tableCell}>{formatDate(p.analyzedAt)}</td>
                  <td className={`${tableCell} text-right`}>
                    <Link
                      href={`/repos/${id}/primitives/${p.id}`}
                      className="inline-flex items-center rounded-full border border-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:text-emerald-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
                    colSpan={10}
                  >
                    No analyses match your filters yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
