import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";

async function getTests(id: string) {
  const res = await fetch(`${API}/repos/${id}/tests`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default async function RepoTestsList({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  const { id } = params;
  const { q, from, to } = searchParams || {};
  const rows = await getTests(id);

  const qlc = (q || "").toLowerCase();
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  const filtered = rows.filter((t: any) => {
    const inQ = qlc
      ? [
          t.baselineCpuUsage,
          t.baselineLatencyMs,
          t.baselineThroughput,
          t.instrumentedCpuUsage,
          t.instrumentedLatencyMs,
          t.instrumentedThroughput,
        ]
          .map((v: any) => String(v ?? "").toLowerCase())
          .some((s: string) => s.includes(qlc))
      : true;
    const ts = new Date(t.testedAt).getTime();
    const inFrom = fromDate ? ts >= fromDate.getTime() : true;
    const inTo = toDate ? ts <= toDate.getTime() : true;
    return inQ && inFrom && inTo;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Overhead Tests</h1>
        <Link href={`/repos/${id}`} className="text-sm text-blue-600">
          ← Back
        </Link>
      </div>

      <form
        className="mb-4 p-4 bg-gray-50 rounded border grid grid-cols-1 md:grid-cols-4 gap-2"
        method="get"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search metrics"
          className="border px-2 py-1 rounded"
        />
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="border px-2 py-1 rounded"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="border px-2 py-1 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Apply
        </button>
      </form>

      <div className="overflow-x-auto">
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t: any) => (
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
                <td>
                  <Link
                    href={`/repos/${id}/tests/${t.id}`}
                    className="text-sm text-blue-600"
                  >
                    See more
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
