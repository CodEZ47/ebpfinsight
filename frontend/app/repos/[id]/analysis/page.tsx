import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";

async function getAnalysis(id: string) {
  const res = await fetch(`${API}/repos/${id}/analysis`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

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

  // simple client-side filter
  const qlc = (q || "").toLowerCase();
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  const filtered = rows.filter((a: any) => {
    const inQ = qlc
      ? String(a.language || "")
          .toLowerCase()
          .includes(qlc) ||
        String(a.defaultBranch || "")
          .toLowerCase()
          .includes(qlc) ||
        String(a.cloneUrl || "")
          .toLowerCase()
          .includes(qlc)
      : true;
    const ts = new Date(a.analyzedAt).getTime();
    const inFrom = fromDate ? ts >= fromDate.getTime() : true;
    const inTo = toDate ? ts <= toDate.getTime() : true;
    return inQ && inFrom && inTo;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Analyses</h1>
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
          placeholder="Search language/branch/url"
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
              <th>Stars</th>
              <th>Forks</th>
              <th>Watchers</th>
              <th>Issues</th>
              <th>Language</th>
              <th>Commits</th>
              <th>Clone URL</th>
              <th>Branch</th>
              <th>Analyzed At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a: any) => (
              <tr key={a.id}>
                <td>{a.stars ?? "-"}</td>
                <td>{a.forks ?? "-"}</td>
                <td>{a.watchers ?? "-"}</td>
                <td>{a.issues ?? "-"}</td>
                <td>{a.language ?? "-"}</td>
                <td>{a.commits ?? "-"}</td>
                <td className="break-all max-w-[280px]">{a.cloneUrl ?? "-"}</td>
                <td>{a.defaultBranch ?? "-"}</td>
                <td>{new Date(a.analyzedAt).toLocaleString()}</td>
                <td>
                  <Link
                    href={`/repos/${id}/analysis/${a.id}`}
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
