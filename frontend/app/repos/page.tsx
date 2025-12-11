import Link from "next/link";
import RepoFiltersForm from "@/components/RepoFiltersForm";
import DeleteRepoButton from "../../components/DeleteRepoButton";

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

function formatCategoryLabel(category: string | null | undefined) {
  if (!category) return "Uncategorized";
  if (category === "UNCATEGORIZED") return "Uncategorized";
  return category.replace(/_/g, " ");
}

function formatCreatedAt(value: string | null | undefined) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildQuery(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      usp.set(key, value);
    }
  });
  return usp.toString();
}

type RepoListResponse = {
  data: any[];
  pagination?: {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  summary?: {
    totalRepos: number;
    categorizedRepos: number;
  };
  error?: string;
};

async function getRepos(
  queryParams: Record<string, string | undefined>
): Promise<RepoListResponse> {
  const qs = buildQuery(queryParams);
  const res = await fetch(`${API}/repos${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return {
      data: [],
      error: `Unable to load repositories (status ${res.status})`,
    };
  }
  return res.json();
}

export default async function ReposPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const {
    search,
    category,
    sort,
    order,
    page: pageParam,
    pageSize: pageSizeParam,
  } = searchParams || {};

  const derivedPageSize = Math.min(
    Math.max(Number(pageSizeParam || "20"), 1),
    200
  );
  const derivedPage = Math.max(Number(pageParam || "1"), 1);

  const repoResponse = await getRepos({
    search,
    category,
    sort,
    order,
    page: derivedPage.toString(),
    pageSize: derivedPageSize.toString(),
  });

  const repos = Array.isArray(repoResponse.data) ? repoResponse.data : [];

  const pagination = repoResponse.pagination || {
    total: repos.length,
    totalPages: 1,
    page: derivedPage,
    pageSize: derivedPageSize,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const totalTracked = repoResponse.summary?.totalRepos ?? repos.length;
  const categorizedTracked =
    repoResponse.summary?.categorizedRepos ??
    repos.filter((repo: any) => Boolean(repo.category)).length;
  const activeFilters = [search, category].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Repositories
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your monitored sources, trigger analyses, and keep
              categories in sync.
            </p>
          </div>
          <Link
            href="/repos/new"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600"
          >
            + Add repository
          </Link>
        </div>
        <dl className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3 dark:text-slate-300">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <dt className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Total tracked
            </dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
              {totalTracked}
            </dd>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-slate-900/20">
            <dt className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Categorized
            </dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
              {categorizedTracked}
            </dd>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm sm:col-span-2 lg:col-span-1 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-slate-900/20">
            <dt className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Filters applied
            </dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
              {activeFilters || "None"}
            </dd>
          </div>
        </dl>
      </div>

      <RepoFiltersForm
        search={search}
        category={category}
        sort={sort}
        order={order}
        categories={categories}
        pageSize={pagination.pageSize.toString()}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {repoResponse.error && (
          <div className="col-span-full rounded-3xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
            {repoResponse.error}
          </div>
        )}
        {!repoResponse.error && Array.isArray(repos) && repos.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-emerald-200 bg-white/70 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
            No repositories match the current filters.
          </div>
        )}
        {Array.isArray(repos) &&
          repos.map((repo: any) => {
            const latest = repo.latestAnalysis;
            const createdLabel = formatCreatedAt(repo.createdAt);
            const repoOriginLabel = latest?.repoCreatedAt
              ? formatCreatedAt(latest.repoCreatedAt)
              : null;
            const categoryLabel = formatCategoryLabel(repo.category);
            return (
              <div
                key={repo.id}
                className="flex h-full flex-col rounded-3xl border border-emerald-100 bg-white/80 p-5 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-emerald-500/30 dark:hover:shadow-slate-900/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Link href={`/repos/${repo.id}`} className="block">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {repo.name}
                      </h3>
                      <p className="break-all text-xs text-slate-500 dark:text-slate-400">
                        {repo.url}
                      </p>
                    </Link>
                    {repo.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <DeleteRepoButton id={repo.id} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {categoryLabel}
                  </span>
                  <span className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                    Added {createdLabel}
                  </span>
                  {repoOriginLabel && (
                    <span className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                      Repo created {repoOriginLabel}
                    </span>
                  )}
                </div>
                {latest && (
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4 dark:text-slate-300">
                    <div className="rounded-2xl border border-emerald-50 bg-emerald-50/60 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                      <dt className="uppercase tracking-wide text-[10px] text-emerald-600 dark:text-emerald-300">
                        Stars
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {latest.stars ?? 0}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-emerald-50 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-900/20">
                      <dt className="uppercase tracking-wide text-[10px] text-emerald-600 dark:text-emerald-300">
                        Forks
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {latest.forks ?? 0}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-emerald-50 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-900/20">
                      <dt className="uppercase tracking-wide text-[10px] text-emerald-600 dark:text-emerald-300">
                        Watchers
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {latest.watchers ?? 0}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-emerald-50 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-900/20">
                      <dt className="uppercase tracking-wide text-[10px] text-emerald-600 dark:text-emerald-300">
                        Issues
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {latest.issues ?? 0}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            );
          })}
      </div>

      {pagination.totalPages > 1 && (
        <nav className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:shadow-lg dark:shadow-slate-900/20 sm:flex-row">
          <span className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <PaginationLink
              label="Previous"
              disabled={!pagination.hasPreviousPage}
              targetPage={pagination.page - 1}
              searchParams={{
                search,
                category,
                sort,
                order,
                pageSize: pagination.pageSize.toString(),
              }}
            />
            <PaginationLink
              label="Next"
              disabled={!pagination.hasNextPage}
              targetPage={pagination.page + 1}
              searchParams={{
                search,
                category,
                sort,
                order,
                pageSize: pagination.pageSize.toString(),
              }}
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function PaginationLink({
  label,
  disabled,
  targetPage,
  searchParams,
}: {
  label: string;
  disabled: boolean;
  targetPage: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-4 py-2 text-slate-500 opacity-60 dark:border-slate-800 dark:bg-slate-900/60">
        {label}
      </span>
    );
  }

  const query = buildQuery({
    ...searchParams,
    page: Math.max(targetPage, 1).toString(),
  });

  return (
    <Link
      href={`/repos${query ? `?${query}` : ""}`}
      className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600"
    >
      {label}
    </Link>
  );
}
