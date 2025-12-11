import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";

async function getAnalysis(id: string) {
  const res = await fetch(`${API}/repos/${id}/analysis`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

const sectionSurface =
  "rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20";
const formSurface =
  "rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20";
const tableShell =
  "overflow-x-auto rounded-3xl border border-emerald-100 bg-white/70 shadow-sm dark:border-slate-800 dark:bg-slate-900/60";
const tableBase =
  "min-w-full divide-y divide-emerald-100 text-left text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300";
const tableHeading =
  "bg-emerald-50/60 text-xs uppercase text-emerald-700 dark:bg-slate-900/60 dark:text-emerald-300";
const tableRow =
  "bg-white/60 hover:bg-emerald-50/60 dark:bg-slate-900/60 dark:hover:bg-slate-900";
const tableCell = "px-4 py-3";
const tableCellHighlight =
  "px-4 py-3 font-medium text-slate-900 dark:text-slate-100";

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

  const qlc = (q || "").toLowerCase();
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  const filtered = rows.filter((a: any) => {
    const inQ = qlc
      ? [a.language, a.defaultBranch, a.cloneUrl]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())
          .some((chunk) => chunk.includes(qlc))
      : true;
    const ts = new Date(a.analyzedAt).getTime();
    const inFrom = fromDate ? ts >= fromDate.getTime() : true;
    const inTo = toDate ? ts <= toDate.getTime() : true;
    return inQ && inFrom && inTo;
  });

  return (
    <div className="space-y-6">
      <div
        className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${sectionSurface}`}
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Analysis History
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track how repository metrics evolved across analysis runs.
          </p>
        </div>
        <Link
          href={`/repos/${id}`}
          className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-emerald-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
        >
          ← Back to repository
        </Link>
      </div>

      <form className={formSurface} method="get">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Keyword
            <input
              name="q"
              defaultValue={q}
              placeholder="Language, branch, URL"
              className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            From
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            To
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </form>

      <div className={tableShell}>
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
              <th className={tableCell}>Analyzed</th>
              <th className={tableCell}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50 dark:divide-slate-800">
            {filtered.map((a: any) => (
              <tr key={a.id} className={tableRow}>
                <td className={tableCellHighlight}>{a.stars ?? "—"}</td>
                <td className={tableCell}>{a.forks ?? "—"}</td>
                <td className={tableCell}>{a.watchers ?? "—"}</td>
                <td className={tableCell}>{a.issues ?? "—"}</td>
                <td className={tableCell}>{a.language ?? "—"}</td>
                <td className={tableCell}>{a.commits ?? "—"}</td>
                <td
                  className={`${tableCell} text-xs text-emerald-600 underline-offset-2 dark:text-emerald-300`}
                >
                  <a
                    href={a.cloneUrl ?? "#"}
                    className="break-all transition hover:underline"
                  >
                    {a.cloneUrl ?? "—"}
                  </a>
                </td>
                <td className={tableCell}>{a.defaultBranch ?? "—"}</td>
                <td className={tableCell}>{formatDate(a.analyzedAt)}</td>
                <td
                  className={`${tableCell} text-right text-xs font-semibold text-emerald-600 dark:text-emerald-300`}
                >
                  <Link
                    href={`/repos/${id}/analysis/${a.id}`}
                    className="rounded-full border border-emerald-100 bg-white px-3 py-1 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                >
                  No analyses match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
