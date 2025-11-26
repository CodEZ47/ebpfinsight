import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";

async function getTestById(testId: string) {
  const res = await fetch(`${API}/repos/tests/${testId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default async function TestDetail({
  params,
}: {
  params: { id: string; testId: string };
}) {
  const { id, testId } = params;
  const t = await getTestById(testId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Overhead Test Detail</h1>
        <div className="space-x-4">
          <Link href={`/repos/${id}/tests`} className="text-sm text-blue-600">
            ← Back to list
          </Link>
          <Link href={`/repos/${id}`} className="text-sm text-blue-600">
            Repo
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="font-medium">Run Count:</span> {t.runCount ?? "-"}
          </div>
          <div>
            <span className="font-medium">Total Run Time (ns):</span>{" "}
            {t.totalRunTimeNs ?? "-"}
          </div>
          <div>
            <span className="font-medium">Avg per Run (ns):</span>{" "}
            {t.avgTimePerRunNs ?? "-"}
          </div>
          <div>
            <span className="font-medium">Baseline CPU:</span>{" "}
            {t.baselineCpuUsage ?? "-"}
          </div>
          <div>
            <span className="font-medium">Baseline Latency (ms):</span>{" "}
            {t.baselineLatencyMs ?? "-"}
          </div>
          <div>
            <span className="font-medium">Baseline Throughput:</span>{" "}
            {t.baselineThroughput ?? "-"}
          </div>
          <div>
            <span className="font-medium">Instrumented CPU:</span>{" "}
            {t.instrumentedCpuUsage ?? "-"}
          </div>
          <div>
            <span className="font-medium">Instrumented Latency (ms):</span>{" "}
            {t.instrumentedLatencyMs ?? "-"}
          </div>
          <div>
            <span className="font-medium">Instrumented Throughput:</span>{" "}
            {t.instrumentedThroughput ?? "-"}
          </div>
          <div>
            <span className="font-medium">Tested At:</span>{" "}
            {new Date(t.testedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
