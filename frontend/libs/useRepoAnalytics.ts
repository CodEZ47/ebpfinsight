"use client";

import React from "react";
import { getApiBase } from "@/libs/apiBase";
import {
  sumRecordValues,
  uniqueKeyCount,
  normalizeCategoryLabel,
} from "@/libs/analyticsUtils";

export interface RepoAnalysisSnapshot {
  stars?: number | null;
  repoCreatedAt?: string | Date | null;
  analyzedAt?: string | Date | null;
  [key: string]: unknown;
}

export interface RepoPrimitiveSnapshot {
  analyzedAt?: string | Date | null;
  totalHelpers: number;
  totalMaps: number;
  totalPrograms: number;
  totalProgramTypes: number;
  totalAttachPoints: number;
  helpers?: Record<string, number>;
  maps?: Record<string, number>;
  mapTypes?: Record<string, number>;
  attachPoints?: Record<string, number>;
  attachTypes?: Record<string, number>;
  programTypes?: Record<string, number>;
  programTypesInferred?: Record<string, number>;
  programSections?: Record<string, number>;
  [key: string]: unknown;
}

export interface RepoAnalyticsSummary {
  id: string;
  numericId?: number;
  name: string;
  category?: string | null;
  normalizedCategory: string;
  latestAnalysis?: RepoAnalysisSnapshot | null;
  latestPrimitive?: RepoPrimitiveSnapshot | null;
  createdAt?: string | Date | null;
  url?: string | null;
  description?: string | null;
  raw?: Record<string, unknown>;
}

export interface UseRepoAnalyticsOptions {
  pageSize?: number;
  maxPages?: number;
  queryParams?: Record<string, string | number | null | undefined>;
  enabled?: boolean;
}

interface UseRepoAnalyticsResult {
  repos: RepoAnalyticsSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumberRecord(
  record?: Record<string, unknown> | null
): Record<string, number> | undefined {
  if (!record) return undefined;
  const entries = Object.entries(record).map(([key, raw]) => {
    const numeric = asNumber(raw) ?? 0;
    return [key, numeric] as const;
  });
  if (!entries.length) return undefined;
  return entries.reduce<Record<string, number>>((acc, [key, numeric]) => {
    acc[key] = numeric;
    return acc;
  }, {});
}

function normalisePrimitive(raw: any): RepoPrimitiveSnapshot | null {
  if (!raw) return null;

  const helpersRecord = toNumberRecord(raw.helpers);
  const mapsRecord = toNumberRecord(raw.maps);
  const mapTypesRecord = toNumberRecord(raw.mapTypes);
  const attachPointsRecord = toNumberRecord(raw.attachPoints);
  const attachTypesRecord = toNumberRecord(raw.attachTypes);
  const programTypesRecord = toNumberRecord(raw.programTypes);
  const programTypesInferredRecord = toNumberRecord(raw.programTypesInferred);
  const programSectionsRecord = toNumberRecord(raw.programSections);

  const totalHelpers =
    asNumber(raw.totalHelpers) ?? sumRecordValues(raw.helpers) ?? 0;
  const mapSource = raw.mapTypes ?? raw.maps;
  const attachSource = raw.attachTypes ?? raw.attachPoints;
  const programTypesSource = raw.programTypesInferred ?? raw.programTypes;

  const totalMaps = asNumber(raw.totalMaps) ?? sumRecordValues(mapSource) ?? 0;
  const totalAttachPoints =
    asNumber(raw.totalAttachPoints) ?? sumRecordValues(attachSource) ?? 0;
  const totalProgramTypes =
    asNumber(raw.totalProgramTypes) ?? uniqueKeyCount(programTypesSource);
  const totalPrograms =
    asNumber(raw.totalPrograms) ??
    asNumber(raw.programsCount) ??
    (Array.isArray(raw.programs) ? raw.programs.length : null) ??
    sumRecordValues(raw.programs) ??
    0;

  return {
    analyzedAt: raw.analyzedAt ?? null,
    totalHelpers: totalHelpers,
    totalMaps,
    totalPrograms,
    totalProgramTypes,
    totalAttachPoints,
    helpers: helpersRecord,
    maps: mapsRecord,
    mapTypes: mapTypesRecord,
    attachPoints: attachPointsRecord,
    attachTypes: attachTypesRecord,
    programTypes: programTypesRecord,
    programTypesInferred: programTypesInferredRecord,
    programSections: programSectionsRecord,
  };
}

function normaliseAnalysis(raw: any): RepoAnalysisSnapshot | null {
  if (!raw) return null;
  const stars = asNumber(raw.stars);
  const result: RepoAnalysisSnapshot = {
    ...raw,
    stars: stars === null ? null : stars,
    repoCreatedAt: raw.repoCreatedAt ?? raw.repo_created_at ?? null,
    analyzedAt: raw.analyzedAt ?? raw.analyzed_at ?? null,
  };
  return result;
}

function buildQueryString(
  queryParams?: Record<string, string | number | null | undefined>
): string {
  if (!queryParams) return "";
  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    params.set(key, String(value));
  });
  return params.toString();
}

export function useRepoAnalytics(
  options: UseRepoAnalyticsOptions = {}
): UseRepoAnalyticsResult {
  const {
    pageSize = 200,
    maxPages = 20,
    queryParams,
    enabled = true,
  } = options;

  const [repos, setRepos] = React.useState<RepoAnalyticsSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const queryFragment = React.useMemo(
    () => buildQueryString(queryParams),
    [queryParams]
  );

  const fetchRepos = React.useCallback(async () => {
    if (!enabled) {
      setRepos([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const base = getApiBase();
      const collected: RepoAnalyticsSummary[] = [];
      for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
        const page = pageIndex + 1;
        const url = `${base}/repos?page=${page}&pageSize=${pageSize}${
          queryFragment ? `&${queryFragment}` : ""
        }`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(
            `Failed to fetch repositories (status ${res.status})`
          );
        }
        const payload = await res.json();
        const records: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];
        if (records.length === 0) {
          break;
        }

        records.forEach((raw: any) => {
          const normalized: RepoAnalyticsSummary = {
            id: String(raw.id ?? ""),
            numericId:
              typeof raw.id === "number"
                ? raw.id
                : asNumber(raw.id) ?? undefined,
            name:
              raw.name || raw.fullName || raw.repoName || String(raw.id ?? ""),
            category: raw.category ?? null,
            normalizedCategory: normalizeCategoryLabel(raw.category),
            latestAnalysis: normaliseAnalysis(raw.latestAnalysis),
            latestPrimitive: normalisePrimitive(raw.latestPrimitive),
            createdAt:
              raw.createdAt ??
              raw.repoCreatedAt ??
              raw.created_at ??
              raw.createdAtUtc ??
              null,
            url: raw.url || raw.htmlUrl || raw.repoUrl || null,
            description: raw.description || raw.repoDescription || null,
            raw,
          };
          collected.push(normalized);
        });

        const hasNextPage = Array.isArray(payload)
          ? records.length >= pageSize
          : Boolean(payload?.pagination?.hasNextPage);
        if (!hasNextPage) {
          break;
        }
      }
      setRepos(collected);
    } catch (err: any) {
      setError(err?.message || String(err));
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, maxPages, pageSize, queryFragment]);

  React.useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  return {
    repos,
    loading,
    error,
    refresh: fetchRepos,
  };
}
