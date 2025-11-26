import Link from "next/link";
import DeleteRepoButton from "../../components/DeleteRepoButton";
import { headers } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";

const categories = [
  "CLOUD_NATIVE_NETWORKING",
  "DEFENSIVE_SECURITY",
  "DEVELOPER_TOOLING_FRAMEWORKS",
  "EDUCATIONAL_DEMONSTRATION_RESOURCES",
  "KERNEL_DATAPLANE_NETWORKING",
  "OBSERVABILITY",
  "OFFENSIVE_SECURITY",
  "OPERATIONS_ORCHESTRATION_LIFECYCLE",
  "PLATFORM_RUNTIME_ACCELERATION",
  "RUNTIME_SECURITY",
  "UNCATEGORIZED",
];

function buildQuery(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) usp.set(k, v);
  });
  return usp.toString();
}

async function getRepos(queryParams: Record<string, string | undefined>) {
  const qs = buildQuery(queryParams);
  const res = await fetch(`${API}/repos${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function ReposPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const { search, category, sort, order } = searchParams || {};
  const repos = await getRepos({ search, category, sort, order });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Repositories</h1>
        <Link href="/repos/new" className="text-sm text-blue-600">
          + Add
        </Link>
      </div>

      <form
        className="mb-4 p-4 bg-gray-50 rounded border space-y-2"
        method="get"
      >
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search name, url, description"
            defaultValue={search}
            className="flex-1 min-w-[240px] border px-2 py-1 rounded"
          />
          <select
            name="category"
            defaultValue={category}
            className="border px-2 py-1 rounded"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "UNCATEGORIZED" ? "Uncategorized" : c}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort || "createdAt"}
            className="border px-2 py-1 rounded"
          >
            <option value="createdAt">Created</option>
            <option value="name">Name</option>
            <option value="stars">Stars</option>
            <option value="forks">Forks</option>
            <option value="watchers">Watchers</option>
            <option value="issues">Issues</option>
            <option value="commits">Commits</option>
          </select>
          <select
            name="order"
            defaultValue={order || "desc"}
            className="border px-2 py-1 rounded"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Apply
          </button>
          <Link
            href="/repos"
            className="px-3 py-1 rounded border text-sm bg-white"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="grid gap-4">
        {repos.map((r: any) => {
          const a = r.latestAnalysis;
          return (
            <div
              key={r.id}
              className="p-4 bg-white rounded shadow hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Link href={`/repos/${r.id}`} className="block">
                    <h3 className="font-semibold">{r.name}</h3>
                    <p className="text-xs text-gray-600 break-all">{r.url}</p>
                  </Link>
                  {r.description && (
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {r.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    {r.category && (
                      <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded">
                        {r.category}
                      </span>
                    )}
                    {a && (
                      <span>
                        ⭐ {a.stars ?? 0} • 🍴 {a.forks ?? 0} • 👀{" "}
                        {a.watchers ?? 0} • 🐞 {a.issues ?? 0}
                      </span>
                    )}
                  </div>
                </div>
                <DeleteRepoButton id={r.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
