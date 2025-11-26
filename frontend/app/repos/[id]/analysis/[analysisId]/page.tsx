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

export default async function AnalysisDetail({
  params,
}: {
  params: { id: string; analysisId: string };
}) {
  const { id, analysisId } = params;
  const a = await getAnalysisById(analysisId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Analysis Detail</h1>
        <div className="space-x-4">
          <Link
            href={`/repos/${id}/analysis`}
            className="text-sm text-blue-600"
          >
            ← Back to list
          </Link>
          <Link href={`/repos/${id}`} className="text-sm text-blue-600">
            Repo
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium">Stars:</span> {a.stars ?? "-"}
          </div>
          <div>
            <span className="font-medium">Forks:</span> {a.forks ?? "-"}
          </div>
          <div>
            <span className="font-medium">Watchers:</span> {a.watchers ?? "-"}
          </div>
          <div>
            <span className="font-medium">Issues:</span> {a.issues ?? "-"}
          </div>
          <div>
            <span className="font-medium">Language:</span> {a.language ?? "-"}
          </div>
          <div>
            <span className="font-medium">Commits:</span> {a.commits ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-medium">Clone URL:</span>{" "}
            <span className="break-all">{a.cloneUrl ?? "-"}</span>
          </div>
          <div>
            <span className="font-medium">Default Branch:</span>{" "}
            {a.defaultBranch ?? "-"}
          </div>
          <div>
            <span className="font-medium">Analyzed At:</span>{" "}
            {new Date(a.analyzedAt).toLocaleString()}
          </div>
        </div>

        <div className="pt-2">
          <ReadmeModal markdown={a.readmeText ?? null} />
        </div>
      </div>
    </div>
  );
}
