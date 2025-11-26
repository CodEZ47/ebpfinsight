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

export default async function RepoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const repo = await getRepo(id);
  const analysis = await getAnalysis(id);
  const tests = await getTests(id);
  const latest = analysis && analysis.length ? analysis[0] : null;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{repo.name}</h1>
        <p className="text-sm text-gray-600">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {repo.url}
          </a>
        </p>
        <p className="mt-2">{repo.description}</p>
        <div className="mt-3 text-sm text-gray-700 space-y-1">
          {repo.category && (
            <div>
              <span className="font-medium">Category:</span> {repo.category}
            </div>
          )}
          {repo.rationale && (
            <div>
              <span className="font-medium">Rationale:</span> {repo.rationale}
            </div>
          )}
          {repo.suggestedNewClass && (
            <div>
              <span className="font-medium">Suggested Class:</span>{" "}
              {repo.suggestedNewClass}
            </div>
          )}
          {repo.createdAt && (
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(repo.createdAt).toLocaleString()}
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <AnalyzeButton id={repo.id} />
            <CategorizeControl id={repo.id} current={repo.category ?? null} />
            <DeleteRepoButton id={repo.id} />
          </div>
        </div>
      </div>

      <section className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Analysis</h2>
        <div className="mb-4">
          <ReadmeModal markdown={latest?.readmeText ?? null} />
          <Link
            href={`/repos/${id}/analysis`}
            className="ml-2 text-sm text-blue-600"
          >
            See more →
          </Link>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-gray-600">
              <th>Stars</th>
              <th>Forks</th>
              <th>Watchers</th>
              <th>Issues</th>
              <th>Language</th>
              <th>Commits</th>
              <th>Branch</th>
              <th>Analyzed At</th>
            </tr>
          </thead>
          <tbody>
            {analysis.map((a: any) => (
              <tr key={a.id}>
                <td>{a.stars ?? "-"}</td>
                <td>{a.forks ?? "-"}</td>
                <td>{a.watchers ?? "-"}</td>
                <td>{a.issues ?? "-"}</td>
                <td>{a.language ?? "-"}</td>
                <td>{a.commits ?? "-"}</td>
                <td>{a.defaultBranch ?? "-"}</td>
                <td>{new Date(a.analyzedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Overhead Tests</h2>
        <div className="mb-3">
          <Link href={`/repos/${id}/tests`} className="text-sm text-blue-600">
            See more →
          </Link>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-gray-600">
              <th>Run Count</th>
              <th>Total Run Time (ns)</th>
              <th>Avg per Run (ns)</th>
              <th>Baseline CPU</th>
              <th>Baseline Latency (ms)</th>
              <th>Baseline Throughput</th>
              <th>Instr. CPU</th>
              <th>Instr. Latency (ms)</th>
              <th>Instr. Throughput</th>
              <th>Tested At</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t: any) => (
              <tr key={t.id}>
                <td>{t.runCount ?? "-"}</td>
                <td>{t.totalRunTimeNs ?? "-"}</td>
                <td>{t.avgTimePerRunNs ?? "-"}</td>
                <td>{t.baselineCpuUsage ?? "-"}</td>
                <td>{t.baselineLatencyMs ?? "-"}</td>
                <td>{t.baselineThroughput ?? "-"}</td>
                <td>{t.instrumentedCpuUsage ?? "-"}</td>
                <td>{t.instrumentedLatencyMs ?? "-"}</td>
                <td>{t.instrumentedThroughput ?? "-"}</td>
                <td>{new Date(t.testedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-4">
        <Link href="/repos" className="text-sm text-blue-600">
          ← Back
        </Link>
      </div>
    </div>
  );
}
