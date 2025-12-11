"use client";
import React from "react";
import { getApiBase } from "@/libs/apiBase";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import { Card, CHART_PALETTE } from "@/components/ui";
import { usePersistentState } from "@/libs/usePersistentState";
import { FiSearch, FiX, FiTrendingUp } from "react-icons/fi";
import HelperFrequencyBar from "@/components/charts/HelperFrequencyBar";
import MapTypeDistribution from "@/components/charts/MapTypeDistribution";
import ProgramTypeDistribution from "@/components/charts/ProgramTypeDistribution";
import AttachPointFrequency from "@/components/charts/AttachPointFrequency";
import RepoComplexityHistogram from "@/components/charts/RepoComplexityHistogram";
import HelpersProgramTypesHeatmap from "@/components/charts/HelpersProgramTypesHeatmap";
import AttachPointsProgramTypesHeatmap from "@/components/charts/AttachPointsProgramTypesHeatmap";
import CategoryAverageRadar from "@/components/charts/CategoryAverageRadar";
import {
  normalizeCategoryLabel,
  formatProgramTypeLabel,
  sumRecordValues,
} from "@/libs/analyticsUtils";
import { useRepoAnalytics } from "@/libs/useRepoAnalytics";

type ProgramsTypesDatum = {
  repo: string;
  programs: number;
  programTypes: number;
  programDensity?: number | null;
  [key: string]: any;
};

const ALL_CHART_IDS = [
  "helpersMaps",
  "programsTypes",
  "attachPoints",
  "helperDistribution",
  "programTypeMatrix",
  "helperFrequency",
  "mapTypeDistribution",
  "attachPointFrequency",
  "repoComplexityHistogram",
  "helpersProgramTypesHeatmap",
  "attachPointsProgramTypesHeatmap",
  "categoryAverageRadar",
];

function safeNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function getMapTotal(primitive: any): number {
  if (!primitive) return 0;
  if (primitive.totalMaps !== undefined && primitive.totalMaps !== null) {
    return safeNumber(primitive.totalMaps);
  }
  return sumRecordValues(primitive?.mapTypes || primitive?.maps);
}

function getAttachTotal(primitive: any): number {
  if (!primitive) return 0;
  if (
    primitive.totalAttachPoints !== undefined &&
    primitive.totalAttachPoints !== null
  ) {
    return safeNumber(primitive.totalAttachPoints);
  }
  return sumRecordValues(primitive?.attachPoints || primitive?.attachTypes);
}

export default function InsightsPage() {
  const { repos, loading, error } = useRepoAnalytics();
  const [selectedRepoIds, setSelectedRepoIds, repoIdsLoaded] =
    usePersistentState<string[]>("repoInsights:selectedRepoIds", []);
  const [showAvg, setShowAvg] = usePersistentState<boolean>(
    "repoInsights:showAvg",
    true
  );
  const [selectedCharts, setSelectedCharts] = usePersistentState<string[]>(
    "repoInsights:selectedCharts",
    [
      "helpersMaps",
      "programsTypes",
      "attachPoints",
      "helperFrequency",
      "mapTypeDistribution",
    ]
  );
  const [search, setSearch] = usePersistentState<string>(
    "repoInsights:search",
    ""
  );
  const [
    selectedCompareCategories,
    setSelectedCompareCategories,
    compareLoaded,
  ] = usePersistentState<string[]>(
    "repoInsights:selectedCompareCategories",
    []
  );

  const allCategories = React.useMemo(() => {
    const set = new Set<string>();
    repos.forEach((repo) => {
      const normalized = normalizeCategoryLabel(repo.category);
      if (normalized) set.add(normalized);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [repos]);

  React.useEffect(() => {
    if (!repoIdsLoaded || repos.length === 0) return;
    const repoIdSet = new Set(repos.map((r) => r.id));
    setSelectedRepoIds((prev) => {
      const filtered = prev.filter((id) => repoIdSet.has(id));
      if (filtered.length > 0) {
        return filtered.length === prev.length ? prev : filtered;
      }
      if (repos.length === 0) return prev;
      return repos.slice(0, Math.min(3, repos.length)).map((r) => r.id);
    });
  }, [repoIdsLoaded, repos, setSelectedRepoIds]);

  const selectedRepos = repos.filter((r) => selectedRepoIds.includes(r.id));

  React.useEffect(() => {
    if (!compareLoaded || allCategories.length === 0) return;
    const allowed = new Set(allCategories);
    setSelectedCompareCategories((prev) => {
      const filtered = prev.filter((category) => allowed.has(category));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [compareLoaded, allCategories, setSelectedCompareCategories]);

  const filteredRepos = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return [];
    return repos.filter((r) => {
      const fields = [r.name, r.category, r.url, r.description]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
  }, [repos, search]);

  function toggleRepo(id: string) {
    setSelectedRepoIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  const [remoteCategoryAverages, setRemoteCategoryAverages] = React.useState<
    Record<
      string,
      {
        helpers: number;
        maps: number;
        programs: number;
        programTypes: number;
        attachPoints: number;
        count?: number;
      }
    >
  >({});

  React.useEffect(() => {
    if (selectedCompareCategories.length === 0) {
      setRemoteCategoryAverages({});
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const qs = encodeURIComponent(selectedCompareCategories.join(","));
        const res = await fetch(
          `${getApiBase()}/repos/categories/averages?categories=${qs}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setRemoteCategoryAverages(data.categories || {});
      } catch (_) {
        // Silently ignore network errors; UI will fall back to local estimates.
      }
    })();
    return () => controller.abort();
  }, [selectedCompareCategories, setRemoteCategoryAverages]);

  const effectiveCategoryAverages = React.useMemo(() => {
    if (selectedCompareCategories.length === 0)
      return {} as typeof remoteCategoryAverages;
    const result: typeof remoteCategoryAverages = {};
    selectedCompareCategories.forEach((category) => {
      const remote = remoteCategoryAverages[category];
      if (remote) {
        result[category] = remote;
        return;
      }
      const matching = repos.filter(
        (repo) => normalizeCategoryLabel(repo.category) === category
      );
      if (matching.length === 0) return;
      const totals = matching.reduce(
        (acc, repo) => {
          const primitive = repo.latestPrimitive;
          if (!primitive) return acc;
          acc.helpers += safeNumber(primitive.totalHelpers);
          acc.maps += getMapTotal(primitive);
          acc.programs += safeNumber(primitive.totalPrograms);
          acc.programTypes += safeNumber(primitive.totalProgramTypes);
          acc.attachPoints += getAttachTotal(primitive);
          acc.count += 1;
          return acc;
        },
        {
          helpers: 0,
          maps: 0,
          programs: 0,
          programTypes: 0,
          attachPoints: 0,
          count: 0,
        }
      );
      if (!totals.count) return;
      result[category] = {
        helpers: Number((totals.helpers / totals.count).toFixed(2)),
        maps: Number((totals.maps / totals.count).toFixed(2)),
        programs: Number((totals.programs / totals.count).toFixed(2)),
        programTypes: Number((totals.programTypes / totals.count).toFixed(2)),
        attachPoints: Number((totals.attachPoints / totals.count).toFixed(2)),
        count: totals.count,
      };
    });
    return result;
  }, [selectedCompareCategories, remoteCategoryAverages, repos]);

  interface RadarRow {
    metric: string;
    repo?: number;
    [key: string]: number | string | undefined;
  }

  const radarData = React.useMemo(() => {
    if (selectedRepos.length === 0) return [] as RadarRow[];

    const averageMetric = (
      selector: (repo: (typeof selectedRepos)[number]) => number
    ) => {
      let total = 0;
      let count = 0;
      selectedRepos.forEach((repo) => {
        const value = selector(repo);
        if (Number.isFinite(value)) {
          total += value;
          count += 1;
        }
      });
      return count ? Number((total / count).toFixed(2)) : 0;
    };

    const aggregateRepo = selectedRepos.length === 1 ? selectedRepos[0] : null;

    const metrics = [
      {
        key: "Helpers",
        repoVal: aggregateRepo
          ? safeNumber(aggregateRepo.latestPrimitive?.totalHelpers)
          : averageMetric((repo) =>
              safeNumber(repo.latestPrimitive?.totalHelpers)
            ),
        extract: (avg: any) => safeNumber(avg?.helpers),
      },
      {
        key: "Programs",
        repoVal: aggregateRepo
          ? safeNumber(aggregateRepo.latestPrimitive?.totalPrograms)
          : averageMetric((repo) =>
              safeNumber(repo.latestPrimitive?.totalPrograms)
            ),
        extract: (avg: any) => safeNumber(avg?.programs),
      },
      {
        key: "Program Types",
        repoVal: aggregateRepo
          ? safeNumber(aggregateRepo.latestPrimitive?.totalProgramTypes)
          : averageMetric((repo) =>
              safeNumber(repo.latestPrimitive?.totalProgramTypes)
            ),
        extract: (avg: any) => safeNumber(avg?.programTypes),
      },
      {
        key: "Maps",
        repoVal: aggregateRepo
          ? getMapTotal(aggregateRepo.latestPrimitive)
          : averageMetric((repo) => getMapTotal(repo.latestPrimitive)),
        extract: (avg: any) => safeNumber(avg?.maps),
      },
      {
        key: "Attach Points",
        repoVal: aggregateRepo
          ? getAttachTotal(aggregateRepo.latestPrimitive)
          : averageMetric((repo) => getAttachTotal(repo.latestPrimitive)),
        extract: (avg: any) => safeNumber(avg?.attachPoints),
      },
    ];

    const categories =
      selectedCompareCategories.length > 0 ? selectedCompareCategories : [];

    return metrics.map((metric) => {
      const row: RadarRow = { metric: metric.key, repo: metric.repoVal };
      categories.forEach((category) => {
        const averages = effectiveCategoryAverages[category];
        row[`cat_${category}`] = averages ? metric.extract(averages) : 0;
      });
      return row;
    });
  }, [selectedRepos, selectedCompareCategories, effectiveCategoryAverages]);

  const barData = React.useMemo(() => {
    const rows = selectedRepos.map((repo) => {
      const primitive = repo.latestPrimitive;
      return {
        repo: repo.name,
        helpers: primitive ? safeNumber(primitive.totalHelpers) : 0,
        maps: getMapTotal(primitive),
        attachPoints: getAttachTotal(primitive),
      };
    });

    const count = rows.length;
    if (showAvg && count > 1) {
      const totals = rows.reduce(
        (acc, row) => {
          acc.helpers += row.helpers;
          acc.maps += row.maps;
          acc.attachPoints += row.attachPoints;
          return acc;
        },
        { helpers: 0, maps: 0, attachPoints: 0 }
      );
      rows.push({
        repo: "Avg (Selected)",
        helpers: Number((totals.helpers / count).toFixed(2)),
        maps: Number((totals.maps / count).toFixed(2)),
        attachPoints: Number((totals.attachPoints / count).toFixed(2)),
      });
    }

    return rows;
  }, [selectedRepos, showAvg]);

  const programsTypesChartData = React.useMemo(() => {
    const repoRows: ProgramsTypesDatum[] = selectedRepos.map((repo) => {
      const primitive = repo.latestPrimitive;
      const programs = primitive ? safeNumber(primitive.totalPrograms) : 0;
      const programTypes = primitive
        ? safeNumber(primitive.totalProgramTypes)
        : 0;
      return {
        repo: repo.name,
        programs,
        programTypes,
      };
    });

    const aggregateRows: ProgramsTypesDatum[] = [];
    if (showAvg && repoRows.length > 1) {
      const totals = repoRows.reduce(
        (acc, row) => {
          acc.programs += row.programs;
          acc.programTypes += row.programTypes;
          return acc;
        },
        { programs: 0, programTypes: 0 }
      );
      const avgPrograms = totals.programs / repoRows.length;
      const avgProgramTypes = totals.programTypes / repoRows.length;
      aggregateRows.push({
        repo: "Avg (Selected)",
        programs: Number(avgPrograms.toFixed(2)),
        programTypes: Number(avgProgramTypes.toFixed(2)),
      });
    }

    const repoSorted = [...repoRows].sort((a, b) => b.programs - a.programs);

    return [...repoSorted, ...aggregateRows].map((row) => ({
      ...row,
      programDensity:
        row.programTypes > 0
          ? Number((row.programs / row.programTypes).toFixed(2))
          : null,
    }));
  }, [selectedRepos, showAvg]);
  function toggleChart(id: string) {
    setSelectedCharts((charts) =>
      charts.includes(id)
        ? charts.filter((chartId) => chartId !== id)
        : [...charts, id]
    );
  }

  function selectAllCharts() {
    setSelectedCharts([...ALL_CHART_IDS]);
  }

  function clearCharts() {
    setSelectedCharts([]);
  }

  const maxPrograms = React.useMemo(() => {
    if (programsTypesChartData.length === 0) return 1;
    return Math.max(
      1,
      ...programsTypesChartData.map((row) => Number(row.programs || 0))
    );
  }, [programsTypesChartData]);

  const maxProgramTypes = React.useMemo(() => {
    if (programsTypesChartData.length === 0) return 1;
    return Math.max(
      1,
      ...programsTypesChartData.map((row) => Number(row.programTypes || 0))
    );
  }, [programsTypesChartData]);

  const renderProgramsTypesTooltip = React.useCallback(
    ({ active, payload }: { active?: boolean; payload?: any[] }) => {
      if (!active || !payload || payload.length === 0) return null;
      const datum = payload[0]?.payload as
        | ((typeof programsTypesChartData)[number] & {
            programDensity?: number | null;
          })
        | undefined;
      if (!datum) return null;
      return (
        <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 space-y-1">
          <div className="font-semibold text-sm">{datum.repo}</div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-500 dark:text-gray-400">Programs</span>
            <span className="font-semibold">{datum.programs}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-500 dark:text-gray-400">
              Program types
            </span>
            <span className="font-semibold">{datum.programTypes}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-500 dark:text-gray-400">
              Programs per type
            </span>
            <span className="font-semibold">
              {datum.programDensity ? `×${datum.programDensity}` : "n/a"}
            </span>
          </div>
        </div>
      );
    },
    [programsTypesChartData]
  );

  // Aggregate helpers & program types for distribution charts
  const topHelpers = React.useMemo(() => {
    const agg: Record<string, number> = {};
    selectedRepos.forEach((r) => {
      const helpers = r.latestPrimitive?.helpers || {};
      Object.entries(helpers).forEach(([k, v]) => {
        agg[k] = (agg[k] || 0) + Number(v);
      });
    });
    return Object.entries(agg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([helper, count]) => ({ helper, count }));
  }, [selectedRepos]);

  const topProgramTypes = React.useMemo(() => {
    const agg: Record<string, number> = {};
    selectedRepos.forEach((r) => {
      const pts = r.latestPrimitive?.programTypesInferred || {};
      Object.entries(pts).forEach(([k, v]) => {
        agg[k] = (agg[k] || 0) + Number(v);
      });
    });
    return Object.entries(agg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pt, count]) => ({ pt, count }));
  }, [selectedRepos]);

  // Matrix dataset: one row per repo with counts for top program types
  const programTypeMatrix = React.useMemo(() => {
    const topKeys = topProgramTypes.map((t) => t.pt);
    const topKeySet = new Set(topKeys);
    return selectedRepos.map((r) => {
      const pts = r.latestPrimitive?.programTypesInferred || {};
      const row: Record<string, number | string> = { repo: r.name };
      let total = 0;
      let other = 0;
      topKeys.forEach((k) => {
        const value = Number(pts[k] || 0);
        row[k] = value;
        total += value;
      });
      Object.entries(pts).forEach(([k, v]) => {
        if (!topKeySet.has(k)) {
          const value = Number(v || 0);
          other += value;
        }
      });
      if (other > 0) {
        row.Other = other;
      }
      row.__total = total + other;
      return row;
    });
  }, [selectedRepos, topProgramTypes]);

  const programTypeMatrixSeries = React.useMemo(() => {
    const base = topProgramTypes.map((t, index) => ({
      key: t.pt,
      label: formatProgramTypeLabel(t.pt),
      color: CHART_PALETTE[index % CHART_PALETTE.length],
    }));
    const hasOther = programTypeMatrix.some(
      (row) => Number((row as any).Other || 0) > 0
    );
    return hasOther
      ? [...base, { key: "Other", label: "Other", color: "#94a3b8" }]
      : base;
  }, [topProgramTypes, programTypeMatrix]);

  const renderProgramMatrixTooltip = React.useCallback(
    ({ active, payload }: { active?: boolean; payload?: any[] }) => {
      if (!active || !payload || payload.length === 0) return null;
      const row = payload[0]?.payload as Record<string, any> | undefined;
      if (!row) return null;
      const total = Number(row.__total || 0);
      return (
        <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 space-y-2">
          <div className="font-semibold text-sm">{row.repo}</div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-500 dark:text-gray-400">
              Total programs
            </span>
            <span className="font-semibold">{total}</span>
          </div>
          <div className="space-y-1">
            {programTypeMatrixSeries.map((series) => {
              const value = Number(row[series.key] || 0);
              if (!value) return null;
              const percent = total
                ? `${((value / total) * 100).toFixed(1)}%`
                : "0%";
              return (
                <div
                  key={series.key}
                  className="flex items-center justify-between gap-6"
                >
                  <span className="text-slate-500 dark:text-gray-400">
                    {series.label}
                  </span>
                  <span className="font-semibold">
                    {value} ({percent})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [programTypeMatrixSeries]
  );

  // Map type distribution across selected repos
  const mapTypeDistribution = React.useMemo(() => {
    const agg: Record<string, number> = {};
    selectedRepos.forEach((r) => {
      const maps = r.latestPrimitive?.mapTypes || r.latestPrimitive?.maps || {};
      Object.entries(maps).forEach(([mapType, v]) => {
        agg[mapType] = (agg[mapType] || 0) + Number(v);
      });
    });
    return Object.entries(agg).map(([type, count]) => ({ type, count }));
  }, [selectedRepos]);

  // Program type distribution: number of repos using each type
  const programTypeDistribution = React.useMemo(() => {
    const agg: Record<string, number> = {};
    selectedRepos.forEach((r) => {
      const pts = r.latestPrimitive?.programTypesInferred || {};
      Object.keys(pts).forEach((pt) => {
        agg[pt] = (agg[pt] || 0) + 1;
      });
    });
    return Object.entries(agg).map(([programType, count]) => ({
      programType,
      count,
    }));
  }, [selectedRepos]);

  // Attach point frequency across repos
  const attachPointFrequency = React.useMemo(() => {
    const agg: Record<string, number> = {};
    selectedRepos.forEach((r) => {
      const aps =
        r.latestPrimitive?.attachTypes || r.latestPrimitive?.attachPoints || {};
      Object.entries(aps).forEach(([attachType, v]) => {
        agg[attachType] = (agg[attachType] || 0) + Number(v);
      });
    });
    return Object.entries(agg).map(([attach, count]) => ({ attach, count }));
  }, [selectedRepos]);

  // Repo complexity histogram (programs per repo)
  const repoComplexityHistogram = React.useMemo(() => {
    const counts = selectedRepos.map((r) =>
      Number(r.latestPrimitive?.totalPrograms || 0)
    );
    const bins: number[] = [0, 1, 2, 3, 5, 8, 13, 21];
    const labels = ["0", "1", "2", "3", "4-5", "6-8", "9-13", "14-21", "22+"];
    const tallies = new Array(labels.length).fill(0);
    counts.forEach((c) => {
      let idx = 0;
      if (c <= 3) idx = c;
      else if (c <= 5) idx = 4;
      else if (c <= 8) idx = 5;
      else if (c <= 13) idx = 6;
      else if (c <= 21) idx = 7;
      else idx = 8;
      tallies[idx] += 1;
    });
    return labels.map((bin, i) => ({ bin, count: tallies[i] }));
  }, [selectedRepos]);

  // Heatmap approximations: co-occurrence of helpers/attach points with program types per repo presence
  const helpersProgramTypesHeatmap = React.useMemo(() => {
    const helperCounts: Record<string, number> = {};
    selectedRepos.forEach((r) => {
      Object.entries(r.latestPrimitive?.helpers || {}).forEach(([h, v]) => {
        helperCounts[h] = (helperCounts[h] || 0) + Number(v);
      });
    });
    const topHelpersKeys = Object.entries(helperCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([h]) => h);
    return topHelpersKeys.map((h) => {
      const row: any = { helper: h };
      selectedRepos.forEach((r) => {
        const pts = r.latestPrimitive?.programTypesInferred || {};
        Object.keys(pts).forEach((pt) => {
          row[pt] =
            (row[pt] || 0) + Number((r.latestPrimitive?.helpers || {})[h] || 0);
        });
      });
      return row;
    });
  }, [selectedRepos]);

  const attachPointsProgramTypesHeatmap = React.useMemo(() => {
    const attachTotals: Record<string, number> = {};
    const contributions: Record<string, Record<string, number>> = {};
    selectedRepos.forEach((repo) => {
      const primitive = repo.latestPrimitive;
      if (!primitive) return;
      const attachSource =
        (primitive.attachPoints as Record<string, unknown> | undefined) ??
        (primitive.attachTypes as Record<string, unknown> | undefined) ??
        {};
      const programSource =
        (primitive.programTypesInferred as
          | Record<string, unknown>
          | undefined) ??
        (primitive.programTypes as Record<string, unknown> | undefined) ??
        {};
      const programTotal =
        primitive.totalPrograms ?? sumRecordValues(programSource) ?? 0;
      const distribution: Array<[string, number]> =
        programTotal > 0
          ? Object.entries(programSource).map(([key, value]) => [
              key,
              Number(value ?? 0) / programTotal,
            ])
          : [];

      Object.entries(attachSource).forEach(([attachKey, rawCount]) => {
        const count = Number(rawCount ?? 0);
        if (!Number.isFinite(count) || count <= 0) return;
        attachTotals[attachKey] = (attachTotals[attachKey] || 0) + count;
        if (!contributions[attachKey]) {
          contributions[attachKey] = {};
        }

        if (distribution.length) {
          distribution.forEach(([progKey, weight]) => {
            if (!Number.isFinite(weight)) return;
            contributions[attachKey][progKey] =
              (contributions[attachKey][progKey] || 0) + count * weight;
          });
        } else {
          contributions[attachKey].Unknown =
            (contributions[attachKey].Unknown || 0) + count;
        }
      });
    });

    const topAttachKeys = Object.entries(attachTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([attach]) => attach);

    const programKeySet = new Set<string>();
    topAttachKeys.forEach((attach) => {
      Object.keys(contributions[attach] || {}).forEach((key) => {
        programKeySet.add(key);
      });
    });

    const programSeries = Array.from(programKeySet)
      .map((key) => {
        const total = topAttachKeys.reduce((acc, attach) => {
          return acc + (contributions[attach]?.[key] ?? 0);
        }, 0);
        return {
          key,
          label: key === "Unknown" ? "Unknown" : formatProgramTypeLabel(key),
          total,
        };
      })
      .sort((a, b) => b.total - a.total)
      .map(({ key, label }) => ({ key, label }));

    const rows = topAttachKeys.map((attach) => {
      const prettyAttach = attach
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
      const row: { attach: string; [key: string]: number | string } = {
        attach: prettyAttach,
      };
      programSeries.forEach(({ key }) => {
        const value = contributions[attach]?.[key] ?? 0;
        row[key] = Number(value.toFixed(2));
      });
      return row;
    });

    return { rows, programSeries };
  }, [selectedRepos]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Repository Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Compare helper, map, attach point, and program metrics across the
          repositories you select below.
        </p>
      </div>
      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          <p className="text-sm">
            Failed to load repository analytics: {error}
          </p>
        </Card>
      )}
      <Card title="Selection & Controls" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Selected Repositories ({selectedRepos.length}
                {repos.length ? ` of ${repos.length}` : ""})
              </span>
              {selectedRepos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRepoIds([])}
                  className="text-xs font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedRepos.length === 0 ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  No repositories selected yet. Use the search to add some.
                </span>
              ) : (
                selectedRepos.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => toggleRepo(repo.id)}
                    className="group flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-emerald-200"
                    title="Click to remove from comparison"
                  >
                    <span>{repo.name}</span>
                    <FiX className="text-xs opacity-70 group-hover:opacity-100" />
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="relative w-full max-w-sm shrink-0">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search repositories…"
              className="w-full rounded-full border border-emerald-100 bg-white py-2 pl-9 pr-10 text-sm text-slate-700 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-gray-800"
                title="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>
        {search && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-slate-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-slate-300">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">Search Matches</span>
              <span>{filteredRepos.length} found</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {filteredRepos.length === 0 ? (
                <span>No repositories matched.</span>
              ) : (
                filteredRepos.map((repo) => {
                  const active = selectedRepoIds.includes(repo.id);
                  return (
                    <button
                      key={repo.id}
                      type="button"
                      onClick={() => toggleRepo(repo.id)}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
                        active
                          ? "border-emerald-300 bg-white text-emerald-700 dark:border-emerald-700 dark:bg-gray-800 dark:text-emerald-200"
                          : "border-transparent bg-emerald-100/60 text-emerald-700 hover:bg-emerald-100 dark:bg-gray-800/60 dark:text-emerald-200 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span>{repo.name}</span>
                      {active ? <FiX className="text-xs" /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
        <div className="flex items-center gap-4 pt-2 text-sm text-slate-600">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showAvg}
              onChange={(e) => setShowAvg(e.target.checked)}
            />{" "}
            Show Average Row
          </label>
          <div className="flex items-start gap-2">
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-medium text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-900"
                onClick={() => {
                  const panel = document.getElementById("cat-select-panel");
                  if (panel) panel.classList.toggle("hidden");
                }}
              >
                <FiTrendingUp /> Categories
              </button>
              <div
                id="cat-select-panel"
                className="absolute z-20 mt-1 hidden max-h-64 w-64 overflow-auto rounded-2xl border border-emerald-100 bg-white p-3 shadow-lg shadow-emerald-100/40 dark:bg-gray-900 dark:border-gray-700"
              >
                <div className="mb-2 text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                  Compare Categories
                </div>
                {allCategories.map((cat) => {
                  const active = selectedCompareCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-emerald-50/70 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() =>
                          setSelectedCompareCategories((prev) =>
                            active
                              ? prev.filter((c) => c !== cat)
                              : [...prev, cat]
                          )
                        }
                      />
                      <span>{cat}</span>
                    </label>
                  );
                })}
                {selectedCompareCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCompareCategories([])}
                    className="mt-2 inline-flex items-center justify-center rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-emerald-100/60 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-emerald-700">
            Charts
          </h3>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            {[
              { id: "helpersMaps", label: "Helpers vs Maps" },
              { id: "programsTypes", label: "Programs & Program Types" },
              { id: "attachPoints", label: "Attach Points" },
              { id: "helperDistribution", label: "Helper Distribution" },
              { id: "programTypeMatrix", label: "Program Type Matrix" },
              { id: "helperFrequency", label: "Helper Usage Frequency" },
              { id: "mapTypeDistribution", label: "Map Type Distribution" },
              { id: "attachPointFrequency", label: "Attach-Point Frequency" },
              {
                id: "repoComplexityHistogram",
                label: "Repo Complexity Histogram",
              },
              {
                id: "helpersProgramTypesHeatmap",
                label: "Helpers vs Program Types Heatmap",
              },
              {
                id: "attachPointsProgramTypesHeatmap",
                label: "Attach-Points vs Program Types Heatmap",
              },
              { id: "categoryAverageRadar", label: "Category-Average Radar" },
            ].map((c) => (
              <label key={c.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedCharts.includes(c.id)}
                  onChange={() => toggleChart(c.id)}
                />{" "}
                {c.label}
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <button
              onClick={selectAllCharts}
              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-medium text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-emerald-300"
            >
              Select All
            </button>
            <button
              onClick={clearCharts}
              className="rounded-full border border-emerald-100 bg-white px-3 py-1 font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      </Card>
      <section className="mt-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Repo Insights
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Compare selected repositories across helpers, maps, programs, and
            primitives.
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {selectedCharts.includes("helpersMaps") && (
            <Card title="Helpers vs Maps Comparison">
              <div className="h-72 -m-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="repo"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="helpers"
                      fill={CHART_PALETTE[1]}
                      name="Helpers"
                    />
                    <Bar dataKey="maps" fill={CHART_PALETTE[2]} name="Maps" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          {selectedCharts.includes("programsTypes") && (
            <Card title="Programs & Program Types" className="xl:col-span-2">
              <div className="h-[24rem] -m-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={programsTypesChartData}
                    layout="vertical"
                    margin={{ top: 56, right: 32, bottom: 16, left: 180 }}
                    barCategoryGap={18}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      xAxisId="programs"
                      domain={[0, Math.ceil(maxPrograms * 1.1)]}
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Program count",
                        position: "insideBottom",
                        offset: -6,
                      }}
                    />
                    <XAxis
                      type="number"
                      xAxisId="programTypes"
                      orientation="top"
                      axisLine={false}
                      tickLine={false}
                      domain={[0, Math.ceil(maxProgramTypes * 1.1)]}
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Program type count",
                        position: "insideTop",
                        offset: -6,
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="repo"
                      tick={{ fontSize: 12 }}
                      width={180}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
                      content={renderProgramsTypesTooltip as any}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={48}
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                    <Bar
                      xAxisId="programs"
                      dataKey="programs"
                      name="Programs"
                      fill={CHART_PALETTE[4]}
                      radius={[0, 8, 8, 0]}
                    >
                      <LabelList
                        dataKey="programs"
                        position="insideRight"
                        content={(props) => {
                          const { x, y, width, height, value } = props as any;
                          if (typeof x !== "number" || typeof y !== "number")
                            return null;
                          const barHeight =
                            typeof height === "number"
                              ? height
                              : Number(height ?? 0);
                          const textX = x + (width || 0) - 8;
                          const textY = y + barHeight / 2;
                          return (
                            <text
                              x={textX}
                              y={textY}
                              fontSize={12}
                              fill="#ffffff"
                              textAnchor="end"
                              dominantBaseline="middle"
                            >
                              {value}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                    <Line
                      xAxisId="programTypes"
                      dataKey="programTypes"
                      name="Program Types"
                      type="monotone"
                      stroke={CHART_PALETTE[0]}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 1, fill: CHART_PALETTE[0] }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Bars compare total program count per repo; the overlay line
                tracks how many distinct program types are represented. Hover to
                inspect the programs-per-type efficiency.
              </p>
            </Card>
          )}
          {selectedCharts.includes("attachPoints") && (
            <Card title="Attach Points Distribution" className="xl:col-span-2">
              <div className="h-72 -m-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="repo"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="attachPoints"
                      fill={CHART_PALETTE[4]}
                      name="Attach Points"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          {selectedCharts.includes("helperDistribution") && (
            <Card title="Helper Distribution (Top 10)">
              <div className="h-72 -m-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topHelpers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="helper"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      fill={CHART_PALETTE[9]}
                      name="Occurrences"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          {selectedCharts.includes("programTypeMatrix") && (
            <Card
              title="Program Type Matrix (Top 10)"
              className="xl:col-span-2"
            >
              <div className="h-[26rem] -m-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={programTypeMatrix}
                    layout="vertical"
                    margin={{ top: 56, right: 32, bottom: 16, left: 180 }}
                    barCategoryGap={18}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Program count",
                        position: "insideBottom",
                        offset: -6,
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="repo"
                      tick={{ fontSize: 12 }}
                      width={180}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
                      content={renderProgramMatrixTooltip as any}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={48}
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                    {programTypeMatrixSeries.map((series, index) => (
                      <Bar
                        key={series.key}
                        dataKey={series.key}
                        name={series.label}
                        stackId="program-types"
                        fill={series.color}
                        radius={
                          index === programTypeMatrixSeries.length - 1
                            ? [0, 8, 8, 0]
                            : [0, 0, 0, 0]
                        }
                      >
                        {index === programTypeMatrixSeries.length - 1 && (
                          <LabelList
                            dataKey="__total"
                            position="right"
                            content={({ x, y, width, height, value }) => {
                              if (
                                typeof x !== "number" ||
                                typeof y !== "number" ||
                                typeof width !== "number"
                              )
                                return null;
                              const total =
                                typeof value === "number"
                                  ? value
                                  : Number(value ?? 0);
                              if (!total) return null;
                              const textX = x + width + 8;
                              const barHeight =
                                typeof height === "number"
                                  ? height
                                  : Number(height ?? 0);
                              const textY = y + barHeight / 2;
                              return (
                                <text
                                  x={textX}
                                  y={textY}
                                  fontSize={12}
                                  fill="#334155"
                                  dominantBaseline="middle"
                                >
                                  {total}
                                </text>
                              );
                            }}
                          />
                        )}
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Each horizontal bar shows how a repo&apos;s programs break down
                across the most common program types. Hover to inspect exact
                counts and percentage contribution.
              </p>
            </Card>
          )}
        </div>
        <Card title="Repo Insights" className="mt-2">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {selectedCharts.includes("helperFrequency") && (
              <HelperFrequencyBar data={topHelpers} />
            )}
            {selectedCharts.includes("mapTypeDistribution") && (
              <MapTypeDistribution data={mapTypeDistribution} />
            )}
            {selectedCharts.includes("programTypeDistribution") && (
              <ProgramTypeDistribution data={programTypeDistribution} />
            )}
            {selectedCharts.includes("attachPointFrequency") && (
              <AttachPointFrequency data={attachPointFrequency} />
            )}
            {selectedCharts.includes("repoComplexityHistogram") && (
              <RepoComplexityHistogram data={repoComplexityHistogram} />
            )}
            {selectedCharts.includes("helpersProgramTypesHeatmap") && (
              <HelpersProgramTypesHeatmap data={helpersProgramTypesHeatmap} />
            )}
            {selectedCharts.includes("attachPointsProgramTypesHeatmap") && (
              <AttachPointsProgramTypesHeatmap
                data={attachPointsProgramTypesHeatmap.rows}
                series={attachPointsProgramTypesHeatmap.programSeries}
              />
            )}
            {selectedCharts.includes("categoryAverageRadar") &&
              radarData.length > 0 && (
                <CategoryAverageRadar
                  data={radarData}
                  categories={selectedCompareCategories}
                  repoLabel={
                    selectedRepos.length === 1
                      ? selectedRepos[0]?.name || "Repo"
                      : "Selected Repos Avg"
                  }
                />
              )}
          </div>
        </Card>
      </section>
      <div className="mt-8 text-xs text-gray-500">
        Computed client-side from latest primitive analyses. Future
        enhancements: historical trends & category benchmarking.
      </div>
    </div>
  );
}
