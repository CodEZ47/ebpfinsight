import Link from "next/link";
import ReadmeModal from "../../../../../components/ReadmeModal";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";

async function getAnalysisById(analysisId: string) {
  const res = await fetch(`${API}/repos/analysis/${analysisId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

export default async function AnalysisDetail({
  params,
}: {
  params: { id: string; analysisId: string };
}) {
  const { id, analysisId } = params;
  const a = await getAnalysisById(analysisId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Analysis Detail
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Deep dive into the metrics captured during this repository scan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/repos/${id}/analysis`}
            className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            ← Back to history
          </Link>
          <Link
            href={`/repos/${id}`}
            className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600"
          >
            Open repository
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm">
        <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-50 bg-emerald-50/70 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Stars
            </span>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {a.stars ?? "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-50 bg-white px-4 py-3 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Forks
            </span>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {a.forks ?? "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-50 bg-white px-4 py-3 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Watchers
            </span>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {a.watchers ?? "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-50 bg-white px-4 py-3 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Issues
            </span>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {a.issues ?? "—"}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
            <span className="font-semibold text-slate-500">Language</span>
            <p className="mt-1 font-medium text-slate-900">
              {a.language ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
            <span className="font-semibold text-slate-500">Commits</span>
            <p className="mt-1 font-medium text-slate-900">
              {a.commits ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm md:col-span-2">
            <span className="font-semibold text-slate-500">Clone URL</span>
            <p className="mt-1 break-all font-medium text-emerald-600">
              {a.cloneUrl ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
            <span className="font-semibold text-slate-500">Default Branch</span>
            <p className="mt-1 font-medium text-slate-900">
              {a.defaultBranch ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
            <span className="font-semibold text-slate-500">Analyzed At</span>
            <p className="mt-1 font-medium text-slate-900">
              {formatDate(a.analyzedAt)}
            </p>
          </div>
        </dl>

        <div className="mt-6">
          <ReadmeModal markdown={a.readmeText ?? null} />
        </div>
      </div>
    </div>
  );
}
