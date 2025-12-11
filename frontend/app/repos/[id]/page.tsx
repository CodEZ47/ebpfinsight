import Link from "next/link";
import DeleteRepoButton from "../../../components/DeleteRepoButton";
import AnalyzeButton from "../../../components/AnalyzeButton";
import CategorizeControl from "../../../components/CategorizeControl";
import ReadmeModal from "../../../components/ReadmeModal";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";

async function getRepo(id: string) {
  const res = await fetch(`${API}/repos/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function getAnalysis(id: string) {
  const res = await fetch(`${API}/repos/${id}/analysis`, { cache: "no-store" });
  return res.json();
}

async function getTests(id: string) {
  const res = await fetch(`${API}/repos/${id}/tests`, { cache: "no-store" });
  return res.json();
}

async function getPrimitives(id: string) {
  const res = await fetch(`${API}/repos/${id}/primitives`, {
    cache: "no-store",
  });
  return res.json();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

const sectionSurface =
  "rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20";
const tableContainer =
  "mt-4 overflow-x-auto rounded-2xl border border-emerald-100 dark:border-slate-800";
const tableBase =
  "min-w-full divide-y divide-emerald-100 text-left text-sm text-slate-600 dark:divide-slate-800 dark:text-slate-300";
const tableHeading =
  "bg-emerald-50/60 text-xs uppercase text-emerald-700 dark:bg-slate-900/60 dark:text-emerald-300";
const tableRow =
  "bg-white/60 hover:bg-emerald-50/60 dark:bg-slate-900/60 dark:hover:bg-slate-900";
const tableCellHighlight =
  "px-4 py-3 font-medium text-slate-900 dark:text-slate-100";
const tableCell = "px-4 py-3";

export default async function RepoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const repo = await getRepo(id);
  const analysis = await getAnalysis(id);
  const tests = await getTests(id);
  const primitives = await getPrimitives(id);
  const latest = analysis && analysis.length ? analysis[0] : null;

  return (
    <div className="space-y-6">
      <section className={sectionSurface}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {repo.name}
              </h1>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                {repo.url}
              </a>
            </div>
            {repo.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {repo.description}
              </p>
            )}
            <dl className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                {repo.category ?? "Uncategorized"}
              </div>
              {repo.createdAt && (
                <div className="rounded-full border border-emerald-100 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                  Created {formatDate(repo.createdAt)}
                </div>
              )}
              {repo.rationale && (
                <div className="rounded-full border border-emerald-100 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                  Rationale: {repo.rationale}
                </div>
              )}
              {repo.suggestedNewClass && (
                <div className="rounded-full border border-emerald-100 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
                  Suggested class: {repo.suggestedNewClass}
                </div>
              )}
            </dl>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnalyzeButton id={repo.id} />
            <CategorizeControl id={repo.id} current={repo.category ?? null} />
            <DeleteRepoButton id={repo.id} />
          </div>
        </div>
      </section>

      <section className={sectionSurface}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Repo Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stars, activity, and metadata from the latest repository scans.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ReadmeModal markdown={latest?.readmeText ?? null} />
            <Link
              href={`/repos/${id}/repo-analysis`}
              className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-emerald-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
            >
              See history →
            </Link>
          </div>
        </div>
        <div className={tableContainer}>
          <table className={tableBase}>
            <thead className={tableHeading}>
              <tr>
                <th className={tableCell}>Stars</th>
                <th className={tableCell}>Forks</th>
                <th className={tableCell}>Watchers</th>
                <th className={tableCell}>Issues</th>
                <th className={tableCell}>Language</th>
                <th className={tableCell}>Commits</th>
                <th className={tableCell}>Branch</th>
                <th className={tableCell}>Repo Created</th>
                <th className={tableCell}>Repo Updated</th>
                <th className={tableCell}>Analyzed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 dark:divide-slate-800">
              {analysis.map((a: any) => (
                <tr key={a.id} className={tableRow}>
                  <td className={tableCellHighlight}>{a.stars ?? "—"}</td>
                  <td className={tableCell}>{a.forks ?? "—"}</td>
                  <td className={tableCell}>{a.watchers ?? "—"}</td>
                  <td className={tableCell}>{a.issues ?? "—"}</td>
                  <td className={tableCell}>{a.language ?? "—"}</td>
                  <td className={tableCell}>{a.commits ?? "—"}</td>
                  <td className={tableCell}>{a.defaultBranch ?? "—"}</td>
                  <td className={tableCell}>{formatDate(a.repoCreatedAt)}</td>
                  <td className={tableCell}>{formatDate(a.repoUpdatedAt)}</td>
                  <td className={tableCell}>{formatDate(a.analyzedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={sectionSurface}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Primitive Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Summaries for helpers, maps, and attach points derived from the
              latest runs.
            </p>
          </div>
          <Link
            href={`/repos/${id}/primitives`}
            className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-emerald-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
          >
            Explore primitives →
          </Link>
        </div>
        <div className={tableContainer}>
          <table className={tableBase}>
            <thead className={tableHeading}>
              <tr>
                <th className={tableCell}>Programs</th>
                <th className={tableCell}>Program Types</th>
                <th className={tableCell}>Helpers</th>
                <th className={tableCell}>Unique Helpers</th>
                <th className={tableCell}>Maps</th>
                <th className={tableCell}>Unique Maps</th>
                <th className={tableCell}>Attach Points</th>
                <th className={tableCell}>Unique Attach Pts</th>
                <th className={tableCell}>Analyzed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 dark:divide-slate-800">
              {primitives.map((p: any) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={sectionSurface}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Overhead Tests
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Baseline versus instrumented performance captured during test
              runs.
            </p>
          </div>
          <Link
            href={`/repos/${id}/tests`}
            className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-emerald-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
          >
            View all tests →
          </Link>
        </div>
        <div className={tableContainer}>
          <table className={tableBase}>
            <thead className={tableHeading}>
              <tr>
                <th className={tableCell}>Run Count</th>
                <th className={tableCell}>Total Runtime (ns)</th>
                <th className={tableCell}>Avg per Run (ns)</th>
                <th className={tableCell}>Baseline CPU</th>
                <th className={tableCell}>Baseline Latency</th>
                <th className={tableCell}>Baseline Throughput</th>
                <th className={tableCell}>Instr. CPU</th>
                <th className={tableCell}>Instr. Latency</th>
                <th className={tableCell}>Instr. Throughput</th>
                <th className={tableCell}>Tested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 dark:divide-slate-800">
              {tests.map((t: any) => (
                <tr key={t.id} className={tableRow}>
                  <td className={tableCellHighlight}>{t.runCount ?? "—"}</td>
                  <td className={tableCell}>{t.totalRunTimeNs ?? "—"}</td>
                  <td className={tableCell}>{t.avgTimePerRunNs ?? "—"}</td>
                  <td className={tableCell}>{t.baselineCpuUsage ?? "—"}</td>
                  <td className={tableCell}>{t.baselineLatencyMs ?? "—"}</td>
                  <td className={tableCell}>{t.baselineThroughput ?? "—"}</td>
                  <td className={tableCell}>{t.instrumentedCpuUsage ?? "—"}</td>
                  <td className={tableCell}>
                    {t.instrumentedLatencyMs ?? "—"}
                  </td>
                  <td className={tableCell}>
                    {t.instrumentedThroughput ?? "—"}
                  </td>
                  <td className={tableCell}>{formatDate(t.testedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end">
        <Link
          href="/repos"
          className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-emerald-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
        >
          ← Back to repositories
        </Link>
      </div>
    </div>
  );
}
