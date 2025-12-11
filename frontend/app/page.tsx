import Link from "next/link";
import { getApiBase } from "@/libs/apiBase";

type RepoSummary = {
  id: number;
  name: string;
  url: string;
  description?: string | null;
  category: string | null;
  createdAt: string;
  latestAnalysis?: {
    analyzedAt: string | null;
    stars?: number | null;
    forks?: number | null;
    issues?: number | null;
  } | null;
  latestPrimitive?: {
    analyzedAt: string | null;
    totalPrograms?: number | null;
    totalAttachPoints?: number | null;
    totalHelpers?: number | null;
  } | null;
};

type RepoSummaryResponse = {
  data: RepoSummary[];
  summary?: {
    totalRepos: number;
    categorizedRepos: number;
  };
  pagination?: {
    page: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatDate(value?: string | null) {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const date = new Date(value);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

async function loadRepos(): Promise<{
  repos: RepoSummary[];
  summary: { totalRepos: number; categorizedRepos: number };
  error?: string;
}> {
  try {
    const API = getApiBase();
    const pageSize = 100;
    const maxPages = 50;
    let currentPage = 1;
    const collected: RepoSummary[] = [];
    let summary: { totalRepos: number; categorizedRepos: number } = {
      totalRepos: 0,
      categorizedRepos: 0,
    };

    while (currentPage <= maxPages) {
      const res = await fetch(
        `${API}/repos?page=${currentPage}&pageSize=${pageSize}`,
        {
          cache: "no-store",
          next: { revalidate: 0 },
        }
      );

      if (!res.ok) {
        return {
          repos: [],
          summary,
          error: `Unable to load repository data (status ${res.status})`,
        };
      }

      const payload = (await res.json()) as RepoSummaryResponse;

      if (!Array.isArray(payload?.data)) {
        return {
          repos: [],
          summary,
          error: "Unexpected response from repository service",
        };
      }

      if (currentPage === 1 && payload.summary) {
        summary = {
          totalRepos: payload.summary.totalRepos ?? 0,
          categorizedRepos: payload.summary.categorizedRepos ?? 0,
        };
      }

      collected.push(...payload.data);

      const pagination = payload.pagination;
      if (!pagination?.hasNextPage) {
        break;
      }

      currentPage += 1;
    }

    if (!summary.totalRepos) {
      const categorizedRepos = collected.filter((repo) => repo.category).length;
      summary = {
        totalRepos: collected.length,
        categorizedRepos,
      };
    }

    return { repos: collected, summary };
  } catch (err: any) {
    return {
      repos: [],
      summary: { totalRepos: 0, categorizedRepos: 0 },
      error: err?.message || "Failed to load repository data",
    };
  }
}

export default async function Home() {
  const { repos, summary, error } = await loadRepos();

  const totalRepos = summary.totalRepos || repos.length;
  const analyzedRepos = repos.filter((repo) => repo.latestAnalysis).length;
  const primitiveRepos = repos.filter((repo) => repo.latestPrimitive).length;
  const pendingRepos = Math.max(totalRepos - analyzedRepos, 0);
  const analysisCoverage = totalRepos
    ? Math.round((analyzedRepos / totalRepos) * 100)
    : 0;
  const uniqueCategories = new Set(
    repos.map((repo) => repo.category || "UNCATEGORIZED")
  );
  const totalPrograms = repos.reduce(
    (sum, repo) => sum + (repo.latestPrimitive?.totalPrograms || 0),
    0
  );
  const totalHelpers = repos.reduce(
    (sum, repo) => sum + (repo.latestPrimitive?.totalHelpers || 0),
    0
  );
  const totalAttachPoints = repos.reduce(
    (sum, repo) => sum + (repo.latestPrimitive?.totalAttachPoints || 0),
    0
  );
  const averagePrograms = analyzedRepos
    ? Math.round(totalPrograms / analyzedRepos)
    : 0;

  const categoryCounts = repos.reduce<Record<string, number>>((acc, repo) => {
    const key = repo.category || "UNCATEGORIZED";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentActivity = [...repos]
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-emerald-50 to-white p-8 shadow-sm dark:border-slate-800 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-950 dark:shadow-lg dark:shadow-slate-900/30">
        <div className="flex flex-col gap-4 text-slate-900 md:flex-row md:items-center md:justify-between dark:text-slate-100">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              Command Center
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Overview & health of your eBPF portfolio
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Monitor repository coverage, follow analysis progress, and jump
              directly into the areas that need your attention.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/repos/new"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600"
            >
              Add Repository
            </Link>
            <Link
              href="/repo-insights"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-emerald-300 dark:hover:border-emerald-500/50 dark:hover:bg-slate-900"
            >
              Open Insights
            </Link>
          </div>
        </div>
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/40 bg-white/70 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-800/50 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total repositories
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {numberFormatter.format(totalRepos)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {summary.categorizedRepos || uniqueCategories.size} categories
              tracked
            </p>
          </article>
          <article className="rounded-2xl border border-white/40 bg-white/70 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-800/50 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Analysis coverage
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-600 dark:text-emerald-300">
              {percentFormatter.format(analysisCoverage)}%
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-emerald-100 dark:bg-slate-800">
              <div
                className="h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
                style={{ width: `${Math.min(analysisCoverage, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {numberFormatter.format(analyzedRepos)} analyzed{" "}
              <span aria-hidden="true">{"\u00b7"}</span>{" "}
              {numberFormatter.format(pendingRepos)} pending
            </p>
          </article>
          <article className="rounded-2xl border border-white/40 bg-white/70 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-800/50 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Primitive insights
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {numberFormatter.format(primitiveRepos)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Avg {averagePrograms || 0} programs / repo
            </p>
          </article>
          <article className="rounded-2xl border border-white/40 bg-white/70 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-800/50 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Attach points monitored
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {numberFormatter.format(totalAttachPoints)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {numberFormatter.format(totalHelpers)} helpers catalogued
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Recent repository activity
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Freshly added sources and their current analysis status.
              </p>
            </div>
            <Link
              href="/repos"
              className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
            >
              See all
            </Link>
          </header>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {recentActivity.map((repo) => {
              const analyzed = Boolean(repo.latestAnalysis);
              const badgeText = analyzed ? "Analyzed" : "Pending";
              const badgeColor = analyzed
                ? "border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
              return (
                <li
                  key={repo.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:shadow-slate-900/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {repo.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {repo.url.replace(/^https?:\/\//, "")}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeColor}`}
                    >
                      {badgeText}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Added {formatDate(repo.createdAt)}</span>
                    <span>
                      {repo.category
                        ? repo.category.replace(/_/g, " ")
                        : "Uncategorized"}
                    </span>
                  </div>
                </li>
              );
            })}
            {!recentActivity.length && (
              <li className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Add repositories to populate this feed.
              </li>
            )}
          </ul>
        </article>

        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Move faster with the operations you use most.
            </p>
            <div className="mt-5 space-y-3">
              <Link
                href="/repos/new"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
              >
                Import new repositories
                <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">
                  Add
                </span>
              </Link>
              <Link
                href="/category-insights"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
              >
                Explore category health
                <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">
                  View
                </span>
              </Link>
              <Link
                href="/repo-insights"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
              >
                Review analysis coverage
                <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">
                  Inspect
                </span>
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Category distribution
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Top focus areas in your portfolio.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {topCategories.map(([category, count]) => {
                const percentage = totalRepos
                  ? Math.round((count / totalRepos) * 100)
                  : 0;
                return (
                  <li
                    key={category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {category.slice(0, 2)}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {category === "UNCATEGORIZED"
                          ? "Uncategorized"
                          : category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{numberFormatter.format(count)}</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {percentage}%
                      </span>
                    </div>
                  </li>
                );
              })}
              {!topCategories.length && (
                <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No repositories yet. Once you add data, distribution will
                  appear here.
                </li>
              )}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
