import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";

async function getAnalysis(id: string) {
  const res = await fetch(`${API}/repos/${id}/analysis`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

const sectionSurface =
  "rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20";
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
  "px-4 py-3 font-semibold text-slate-900 dark:text-slate-100";

export default async function RepoAnalysisList({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  const { id } = params;
  const { q, from, to } = searchParams || {};
  const rows = await getAnalysis(id);

  const query = (q || "").toLowerCase();
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  const filtered = rows.filter((analysis: any) => {
    const haystack = [
      analysis.language,
      analysis.defaultBranch,
      analysis.cloneUrl,
    ]
      .map((value: string | null) => (value || "").toLowerCase())
      .join(" ");
    const timestamp = new Date(analysis.analyzedAt).getTime();
    const matchesQuery = query ? haystack.includes(query) : true;
    const matchesFrom = fromDate ? timestamp >= fromDate.getTime() : true;
    const matchesTo = toDate ? timestamp <= toDate.getTime() : true;
    return matchesQuery && matchesFrom && matchesTo;
  });

  return (
    <div className="space-y-6">
      <div
        className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${sectionSurface}`}
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Repository Analysis History
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review past metadata snapshots to spot growth trends and reliability
            signals.
          </p>
        </div>
        <Link
          href={`/repos/${id}`}
          className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-emerald-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
        >
          ← Back to overview
        </Link>
      </div>

      <form className={formSurface} method="get">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))_auto]">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Search
            <input
              name="q"
              defaultValue={q}
              placeholder="Filter by language, branch, URL"
              className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            From
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            To
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
            />
          </label>
          <button
            type="submit"
            className="self-end rounded-full border border-emerald-500 bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600"
          >
            Apply filters
          </button>
        </div>
      </form>

      <div className={tableShell}>
        <div className="overflow-x-auto">
          <table className={tableBase}>
            <thead className={tableHeading}>
              <tr>
                <th className={tableCell}>Stars</th>
                <th className={tableCell}>Forks</th>
                <th className={tableCell}>Watchers</th>
                <th className={tableCell}>Issues</th>
                <th className={tableCell}>Language</th>
                <th className={tableCell}>Commits</th>
                <th className={tableCell}>Clone URL</th>
                <th className={tableCell}>Branch</th>
                <th className={tableCell}>Repo Created</th>
                <th className={tableCell}>Repo Updated</th>
                <th className={tableCell}>Analyzed At</th>
                <th className={tableCell} aria-label="actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 dark:divide-slate-800">
              {filtered.map((analysis: any) => (
                <tr key={analysis.id} className={tableRow}>
                  <td className={tableCellHighlight}>
                    {analysis.stars ?? "—"}
                  </td>
                  <td className={tableCell}>{analysis.forks ?? "—"}</td>
                  <td className={tableCell}>{analysis.watchers ?? "—"}</td>
                  <td className={tableCell}>{analysis.issues ?? "—"}</td>
                  <td className={tableCell}>{analysis.language ?? "—"}</td>
                  <td className={tableCell}>{analysis.commits ?? "—"}</td>
                  <td
                    className={`${tableCell} text-emerald-600 dark:text-emerald-300`}
                  >
                    <span className="break-all">
                      {analysis.cloneUrl ?? "—"}
                    </span>
                  </td>
                  <td className={tableCell}>{analysis.defaultBranch ?? "—"}</td>
                  <td className={tableCell}>
                    {formatDate(analysis.repoCreatedAt)}
                  </td>
                  <td className={tableCell}>
                    {formatDate(analysis.repoUpdatedAt)}
                  </td>
                  <td className={tableCell}>
                    {formatDate(analysis.analyzedAt)}
                  </td>
                  <td className={`${tableCell} text-right`}>
                    <Link
                      href={`/repos/${id}/repo-analysis/${analysis.id}`}
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
                    className="px-4 py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
                    colSpan={12}
                  >
                    No analyses match your current filters yet.
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
