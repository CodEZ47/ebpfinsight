"use client";

import React from "react";
import { Card, StatGrid } from "@/components/ui";
import { usePersistentState } from "@/libs/usePersistentState";
import CategoryDistributionBar from "@/components/charts/CategoryDistributionBar";
import CategoryPercentagePie from "@/components/charts/CategoryPercentagePie";
import CategoryPopularityBubble from "@/components/charts/CategoryPopularityBubble";
import CategoryFeatureHeatmap from "@/components/charts/CategoryFeatureHeatmap";
import CategoryGrowthTimeline from "@/components/charts/CategoryGrowthTimeline";
import BulkCategoryAnalyzeButton from "@/components/BulkCategoryAnalyzeButton";
import {
  computeCategoryAggregates,
  buildCategoryDistribution,
  buildCategoryPercentages,
  buildCategoryPopularity,
  buildCategoryFeatureMatrix,
  buildCategoryTimeline,
  RepoAnalyticsRecord,
} from "@/libs/categoryAnalytics";
import {
  normalizeCategoryLabel,
  sumRecordValues,
  uniqueKeyCount,
} from "@/libs/analyticsUtils";
import { useRepoAnalytics } from "@/libs/useRepoAnalytics";
import { FiCheck } from "react-icons/fi";

const CATEGORY_CHART_OPTIONS = [
  { id: "categoryDistribution", label: "Category Distribution" },
  { id: "categoryPercentage", label: "Percentage Share" },
  { id: "categoryPopularity", label: "Popularity Bubble" },
  { id: "categoryFeature", label: "Feature Heatmap" },
  { id: "categoryTimeline", label: "Growth Timeline" },
];

const DEFAULT_CATEGORY_CHART_IDS = CATEGORY_CHART_OPTIONS.map(
  (option) => option.id
);

export default function CategoryInsightsPage() {
  const { repos, loading, error } = useRepoAnalytics();
  const [selectedCategoryFilters, setSelectedCategoryFilters, filtersLoaded] =
    usePersistentState<string[]>(
      "categoryInsights:selectedCategoryFilters",
      []
    );
  const [selectedCategoryCharts, setSelectedCategoryCharts] =
    usePersistentState<string[]>(
      "categoryInsights:selectedCategoryCharts",
      DEFAULT_CATEGORY_CHART_IDS
    );

  const allCategories = React.useMemo(() => {
    const set = new Set<string>();
    repos.forEach((repo) => {
      set.add(normalizeCategoryLabel(repo.category));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [repos]);

  React.useEffect(() => {
    if (!filtersLoaded || allCategories.length === 0) return;
    setSelectedCategoryFilters((prev) => {
      const allowed = prev.filter((cat) => allCategories.includes(cat));
      if (prev.length === 0 || allowed.length === 0) {
        return [...allCategories];
      }
      return allowed.length === prev.length ? prev : allowed;
    });
  }, [allCategories, filtersLoaded, setSelectedCategoryFilters]);

  const categoryAnalyticsSource = React.useMemo<RepoAnalyticsRecord[]>(() => {
    return repos.map((repo) => {
      const primitive = repo.latestPrimitive;
      const mapsSource =
        (primitive?.mapTypes as Record<string, unknown> | undefined) ??
        (primitive?.maps as Record<string, unknown> | undefined);
      const attachSource =
        (primitive?.attachTypes as Record<string, unknown> | undefined) ??
        (primitive?.attachPoints as Record<string, unknown> | undefined);
      const programTypesSource =
        (primitive?.programTypesInferred as
          | Record<string, unknown>
          | undefined) ??
        (primitive?.programTypes as Record<string, unknown> | undefined);

      const helpersTotal =
        primitive?.totalHelpers ??
        sumRecordValues(
          primitive?.helpers as Record<string, unknown> | undefined
        ) ??
        0;
      const mapsTotal =
        primitive?.totalMaps ?? sumRecordValues(mapsSource) ?? 0;
      const attachTotal =
        primitive?.totalAttachPoints ?? sumRecordValues(attachSource) ?? 0;
      const programTypeTotal =
        primitive?.totalProgramTypes ?? uniqueKeyCount(programTypesSource);
      const programsTotal =
        primitive?.totalPrograms ??
        (typeof primitive?.programsCount === "number"
          ? primitive.programsCount
          : Array.isArray(primitive?.programs)
          ? primitive.programs.length
          : sumRecordValues(
              primitive?.programs as Record<string, unknown> | undefined
            )) ??
        0;

      return {
        id: repo.id,
        name: repo.name,
        category: repo.category,
        url: repo.url ?? undefined,
        description: repo.description ?? undefined,
        createdAt: repo.createdAt ?? null,
        latestAnalysis: repo.latestAnalysis
          ? {
              stars:
                repo.latestAnalysis.stars === undefined
                  ? null
                  : Number(repo.latestAnalysis.stars),
              repoCreatedAt: repo.latestAnalysis.repoCreatedAt ?? null,
              analyzedAt: repo.latestAnalysis.analyzedAt ?? null,
            }
          : undefined,
        latestPrimitive: {
          totalHelpers: Number(helpersTotal),
          totalMaps: Number(mapsTotal),
          totalPrograms: Number(programsTotal),
          totalProgramTypes: Number(programTypeTotal),
          totalAttachPoints: Number(attachTotal),
        },
      };
    });
  }, [repos]);

  const categoryAggregates = React.useMemo(
    () => computeCategoryAggregates(categoryAnalyticsSource),
    [categoryAnalyticsSource]
  );

  const filteredCategoryAggregates = React.useMemo(() => {
    if (selectedCategoryFilters.length === 0) return [];
    const allowed = new Set(selectedCategoryFilters);
    return categoryAggregates.filter((item) => allowed.has(item.category));
  }, [categoryAggregates, selectedCategoryFilters]);

  const categoryDistribution = React.useMemo(
    () => buildCategoryDistribution(filteredCategoryAggregates),
    [filteredCategoryAggregates]
  );

  const categoryPercentages = React.useMemo(
    () => buildCategoryPercentages(filteredCategoryAggregates),
    [filteredCategoryAggregates]
  );

  const categoryPopularity = React.useMemo(
    () => buildCategoryPopularity(filteredCategoryAggregates),
    [filteredCategoryAggregates]
  );

  const categoryFeatureHeatmapData = React.useMemo(
    () => buildCategoryFeatureMatrix(filteredCategoryAggregates),
    [filteredCategoryAggregates]
  );

  const filteredCategorySource = React.useMemo(() => {
    if (selectedCategoryFilters.length === 0) return [];
    const allowed = new Set(selectedCategoryFilters);
    return categoryAnalyticsSource.filter((repo) =>
      allowed.has(normalizeCategoryLabel(repo.category))
    );
  }, [categoryAnalyticsSource, selectedCategoryFilters]);

  const selectedReposForBulk = React.useMemo(() => {
    const seen = new Set<string>();
    const targets: { id: string; name?: string | null }[] = [];
    filteredCategorySource.forEach((repo) => {
      if (repo.id === undefined || repo.id === null) return;
      const key = String(repo.id);
      if (seen.has(key)) return;
      seen.add(key);
      const displayName =
        repo.name ||
        (repo.url ? repo.url.split("/").pop() || undefined : undefined);
      targets.push({ id: key, name: displayName });
    });
    return targets;
  }, [filteredCategorySource]);

  const categoryTimeline = React.useMemo(
    () =>
      filteredCategorySource.length
        ? buildCategoryTimeline(
            filteredCategorySource,
            "year" // Always show year-over-year growth per category.
          )
        : [],
    [filteredCategorySource]
  );

  const statItems = React.useMemo(() => {
    if (!filteredCategoryAggregates.length) {
      return [
        {
          label: "Selected Categories",
          value: String(selectedCategoryFilters.length),
        },
        {
          label: "Repositories Matched",
          value: String(filteredCategorySource.length),
        },
      ];
    }
    const totalRepos = filteredCategoryAggregates.reduce(
      (acc, item) => acc + item.repoCount,
      0
    );
    const topCategory = filteredCategoryAggregates[0];
    const averageStars = (
      filteredCategoryAggregates.reduce(
        (acc, item) => acc + item.totalStars,
        0
      ) / (filteredCategoryAggregates.length || 1)
    ).toFixed(1);
    return [
      {
        label: "Selected Categories",
        value: String(filteredCategoryAggregates.length),
      },
      { label: "Repositories Matched", value: String(totalRepos) },
      {
        label: "Avg Stars per Category",
        value: Number.isNaN(Number(averageStars)) ? "0" : averageStars,
      },
      {
        label: "Top Category",
        value: topCategory
          ? `${topCategory.category} (${topCategory.repoCount})`
          : "—",
      },
    ];
  }, [
    filteredCategoryAggregates,
    filteredCategorySource,
    selectedCategoryFilters.length,
  ]);

  const hasCategorySelectionData =
    filteredCategoryAggregates.length > 0 || categoryTimeline.length > 0;

  function toggleCategoryFilter(category: string) {
    setSelectedCategoryFilters((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  function selectAllCategoryFilters() {
    setSelectedCategoryFilters([...allCategories]);
  }

  function clearCategoryFilters() {
    setSelectedCategoryFilters([]);
  }

  function toggleCategoryChart(id: string) {
    setSelectedCategoryCharts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function selectAllCategoryCharts() {
    setSelectedCategoryCharts(
      CATEGORY_CHART_OPTIONS.map((option) => option.id)
    );
  }

  function clearCategoryCharts() {
    setSelectedCategoryCharts([]);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Category Insights
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Explore category-level analytics aggregated across the entire
          repository catalog.
        </p>
      </div>
      {error && (
        <Card className="mb-4 bg-red-50 border-red-200 text-red-700">
          <p className="text-sm">{error}</p>
        </Card>
      )}
      <Card className="mb-6" title="Overview">
        {loading ? (
          <p className="text-sm text-gray-600">Loading repositories…</p>
        ) : (
          <StatGrid items={statItems} />
        )}
      </Card>
      <Card title="Category Controls" className="mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm">Categories</h3>
            {allCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {allCategories.map((cat) => {
                  const active = selectedCategoryFilters.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategoryFilter(cat)}
                      className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full border transition ${
                        active
                          ? "border-emerald-200 bg-emerald-100/60 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-200"
                          : "border-emerald-100 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/90 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                      title={
                        active
                          ? "Click to exclude this category"
                          : "Click to include this category"
                      }
                    >
                      {active && <FiCheck className="text-xs" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Categories will appear once repositories are loaded.
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={selectAllCategoryFilters}
                className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-emerald-300"
              >
                Select All
              </button>
              <button
                onClick={clearCategoryFilters}
                className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-sm mb-2">Charts</h3>
            <div className="flex flex-wrap gap-3 text-xs">
              {CATEGORY_CHART_OPTIONS.map((option) => (
                <label key={option.id} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedCategoryCharts.includes(option.id)}
                    onChange={() => toggleCategoryChart(option.id)}
                  />{" "}
                  {option.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={selectAllCategoryCharts}
                className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-emerald-300"
              >
                Select All
              </button>
              <button
                onClick={clearCategoryCharts}
                className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-sm mb-2">Bulk Actions</h3>
            <p className="mb-3 text-xs text-slate-500 dark:text-gray-400">
              Queue repo analysis jobs for every repository in the selected
              categories. The job count updates as each request is submitted.
            </p>
            <BulkCategoryAnalyzeButton
              repos={selectedReposForBulk}
              disabled={
                loading ||
                selectedCategoryFilters.length === 0 ||
                !selectedReposForBulk.length
              }
              className="inline-flex flex-col gap-2"
            />
          </div>
        </div>
      </Card>
      {selectedCategoryFilters.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select at least one category to view insights.
        </p>
      ) : selectedCategoryCharts.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enable at least one chart to view category insights.
        </p>
      ) : !hasCategorySelectionData ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No analytics are available for the selected categories yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {selectedCategoryCharts.includes("categoryDistribution") && (
            <CategoryDistributionBar data={categoryDistribution} />
          )}
          {selectedCategoryCharts.includes("categoryPercentage") && (
            <CategoryPercentagePie data={categoryPercentages} />
          )}
          {selectedCategoryCharts.includes("categoryPopularity") && (
            <CategoryPopularityBubble data={categoryPopularity} />
          )}
          {selectedCategoryCharts.includes("categoryFeature") && (
            <CategoryFeatureHeatmap data={categoryFeatureHeatmapData} />
          )}
          {selectedCategoryCharts.includes("categoryTimeline") && (
            <CategoryGrowthTimeline data={categoryTimeline} />
          )}
        </div>
      )}
    </div>
  );
}
