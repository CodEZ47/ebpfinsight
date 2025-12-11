import { normalizeCategoryLabel } from "@/libs/analyticsUtils";

export interface RepoAnalyticsRecord {
  id: string | number;
  name?: string | null;
  category?: string | null;
  url?: string | null;
  description?: string | null;
  createdAt?: string | Date | null;
  latestAnalysis?: {
    stars?: number | null;
    repoCreatedAt?: string | Date | null;
    analyzedAt?: string | Date | null;
  } | null;
  latestPrimitive?: {
    totalHelpers?: number | null;
    totalMaps?: number | null;
    totalPrograms?: number | null;
    totalProgramTypes?: number | null;
    totalAttachPoints?: number | null;
  } | null;
}

export interface CategoryAggregate {
  category: string;
  repoCount: number;
  percentage: number;
  totalStars: number;
  avgHelpers: number;
  avgMaps: number;
  avgPrograms: number;
  avgProgramTypes: number;
  avgAttachPoints: number;
}

export interface TimelinePoint {
  year: number;
  [category: string]: number | string;
}

export function computeCategoryAggregates(
  repos: RepoAnalyticsRecord[]
): CategoryAggregate[] {
  if (!repos.length) return [];

  const totalRepos = repos.length;
  const aggregate = new Map<
    string,
    {
      count: number;
      stars: number;
      helpers: number;
      maps: number;
      programs: number;
      programTypes: number;
      attachPoints: number;
    }
  >();

  repos.forEach((repo) => {
    const category = normalizeCategoryLabel(repo.category);
    const entry = aggregate.get(category) || {
      count: 0,
      stars: 0,
      helpers: 0,
      maps: 0,
      programs: 0,
      programTypes: 0,
      attachPoints: 0,
    };

    entry.count += 1;
    entry.stars += repo.latestAnalysis?.stars ?? 0;
    entry.helpers += repo.latestPrimitive?.totalHelpers ?? 0;
    entry.maps += repo.latestPrimitive?.totalMaps ?? 0;
    entry.programs += repo.latestPrimitive?.totalPrograms ?? 0;
    entry.programTypes += repo.latestPrimitive?.totalProgramTypes ?? 0;
    entry.attachPoints += repo.latestPrimitive?.totalAttachPoints ?? 0;

    aggregate.set(category, entry);
  });

  return Array.from(aggregate.entries())
    .map(([category, values]) => ({
      category,
      repoCount: values.count,
      percentage: Number(((values.count / totalRepos) * 100).toFixed(2)),
      totalStars: values.stars,
      avgHelpers: Number((values.helpers / values.count || 0).toFixed(2)),
      avgMaps: Number((values.maps / values.count || 0).toFixed(2)),
      avgPrograms: Number((values.programs / values.count || 0).toFixed(2)),
      avgProgramTypes: Number(
        (values.programTypes / values.count || 0).toFixed(2)
      ),
      avgAttachPoints: Number(
        (values.attachPoints / values.count || 0).toFixed(2)
      ),
    }))
    .sort((a, b) => b.repoCount - a.repoCount);
}

export function buildCategoryDistribution(data: CategoryAggregate[]) {
  return data.map((item) => ({
    category: item.category,
    count: item.repoCount,
  }));
}

export function buildCategoryPercentages(data: CategoryAggregate[]) {
  return data.map((item) => ({
    name: item.category,
    value: item.percentage,
  }));
}

export function buildCategoryPopularity(data: CategoryAggregate[]) {
  return data.map((item) => ({
    category: item.category,
    repos: item.repoCount,
    stars: item.totalStars,
  }));
}

export function buildCategoryFeatureMatrix(data: CategoryAggregate[]) {
  const rows: { category: string; feature: string; value: number }[] = [];
  data.forEach((item) => {
    rows.push({
      category: item.category,
      feature: "Helpers",
      value: item.avgHelpers,
    });
    rows.push({
      category: item.category,
      feature: "Maps",
      value: item.avgMaps,
    });
    rows.push({
      category: item.category,
      feature: "Program Types",
      value: item.avgProgramTypes,
    });
    rows.push({
      category: item.category,
      feature: "Attach Points",
      value: item.avgAttachPoints,
    });
  });
  return rows;
}

export function buildCategoryTimeline(
  repos: RepoAnalyticsRecord[],
  granularity: "month" | "year" = "month"
): TimelinePoint[] {
  if (!repos.length) return [];

  if (granularity !== "year") {
    throw new Error(
      "buildCategoryTimeline currently supports yearly granularity only"
    );
  }

  const timelineBuckets = new Map<number, Map<string, number>>();
  const categories = new Set<string>();
  let minYear: number | null = null;
  let maxYear: number | null = null;

  repos.forEach((repo) => {
    const analyzedAt = repo.latestAnalysis?.analyzedAt;
    if (!analyzedAt) return; // only include repos that have an analysis run

    const rawDate =
      repo.latestAnalysis?.repoCreatedAt ?? repo.createdAt ?? analyzedAt;
    if (!rawDate) return;
    const created = new Date(rawDate);
    if (Number.isNaN(created.getTime())) return;

    const year = created.getFullYear();
    const category = normalizeCategoryLabel(repo.category);
    categories.add(category);

    const bucket = timelineBuckets.get(year) || new Map<string, number>();
    bucket.set(category, (bucket.get(category) || 0) + 1);
    timelineBuckets.set(year, bucket);

    minYear = minYear === null ? year : Math.min(minYear, year);
    maxYear = maxYear === null ? year : Math.max(maxYear, year);
  });

  if (minYear === null || maxYear === null) return [];

  const startYear = minYear as number;
  const endYear = maxYear as number;

  const categoryList = Array.from(categories.values());
  const points: TimelinePoint[] = [];
  const runningTotals = new Map<string, number>();

  for (let year = startYear; year <= endYear; year += 1) {
    const bucket = timelineBuckets.get(year) || new Map<string, number>();
    const point: TimelinePoint = { year };
    categoryList.forEach((category) => {
      const current = runningTotals.get(category) || 0;
      const increment = bucket.get(category) || 0;
      const total = current + increment;
      runningTotals.set(category, total);
      point[category] = total;
    });
    points.push(point);
  }

  return points;
}
