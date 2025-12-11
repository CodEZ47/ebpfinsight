"use client";

import React from "react";
import CollapsibleCard from "@/components/CollapsibleCard";

export interface CategoryFeatureHeatmapDatum {
  category: string;
  feature: string;
  value: number;
}

interface CategoryFeatureHeatmapProps {
  data: CategoryFeatureHeatmapDatum[];
}

function getCellColor(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return "rgba(148, 163, 184, 0.35)"; // slate-400/35
  if (max === min) return "#60a5fa"; // same tone if values identical
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const start = [219, 234, 254]; // blue-100
  const mid = [96, 165, 250]; // blue-400
  const end = [30, 64, 175]; // blue-800
  const blendPoint = ratio < 0.5 ? start : mid;
  const blendTarget = ratio < 0.5 ? mid : end;
  const localRatio = ratio < 0.5 ? ratio / 0.5 : (ratio - 0.5) / 0.5;
  const r = Math.round(
    blendPoint[0] + (blendTarget[0] - blendPoint[0]) * localRatio
  );
  const g = Math.round(
    blendPoint[1] + (blendTarget[1] - blendPoint[1]) * localRatio
  );
  const b = Math.round(
    blendPoint[2] + (blendTarget[2] - blendPoint[2]) * localRatio
  );
  return `rgb(${r}, ${g}, ${b})`;
}

export default function CategoryFeatureHeatmap({
  data,
}: CategoryFeatureHeatmapProps) {
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => set.add(d.category));
    return Array.from(set);
  }, [data]);

  const features = React.useMemo(() => {
    const order = ["Helpers", "Maps", "Program Types", "Attach Points"];
    const unique = Array.from(new Set(data.map((d) => d.feature)));
    return unique.sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [data]);

  const [minValue, maxValue] = React.useMemo(() => {
    if (!data.length) return [0, 0] as const;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    data.forEach((item) => {
      min = Math.min(min, item.value);
      max = Math.max(max, item.value);
    });
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 0] as const;
    return [min, max] as const;
  }, [data]);

  const matrix = React.useMemo(() => {
    const result = new Map<string, Map<string, number>>();
    features.forEach((feature) => {
      result.set(feature, new Map());
    });
    data.forEach((item) => {
      const row = result.get(item.feature);
      if (!row) return;
      row.set(item.category, item.value);
    });
    return result;
  }, [data, features]);

  const legendStops = React.useMemo(() => {
    if (maxValue === minValue) {
      return [minValue];
    }
    const step = (maxValue - minValue) / 4;
    return [0, 1, 2, 3, 4].map((i) => minValue + step * i);
  }, [minValue, maxValue]);

  return (
    <CollapsibleCard
      title="Category Feature Heatmap"
      className="xl:col-span-2"
      collapsedContent={
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <p>Chart collapsed.</p>
          <p>
            Higher intensity indicates larger average helper, map, program type,
            or attach point usage per repository.
          </p>
        </div>
      }
    >
      <div className="-mx-4 -mb-4 px-4 pb-4">
        <div className="overflow-x-auto">
          <div
            className="inline-grid text-xs sm:text-sm border border-gray-200 dark:border-gray-800 rounded-md shadow-sm bg-white dark:bg-gray-900/40"
            style={{
              gridTemplateColumns: `160px repeat(${categories.length}, minmax(120px, 1fr))`,
            }}
            role="table"
            aria-label="Average primitive features per category"
          >
            <div
              className="sticky left-0 bg-gray-50 dark:bg-gray-900/70 font-medium uppercase text-[0.6rem] sm:text-[0.7rem] tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-200 dark:border-gray-800"
              role="columnheader"
            >
              Feature
            </div>
            {categories.map((category) => (
              <div
                key={category}
                className="font-medium text-gray-700 dark:text-gray-200 px-3 py-2 border-b border-gray-200 dark:border-gray-800 text-center truncate"
                title={category}
                role="columnheader"
              >
                {category.replace(/_/g, " ")}
              </div>
            ))}
            {features.map((feature) => {
              const row = matrix.get(feature) || new Map<string, number>();
              return (
                <React.Fragment key={feature}>
                  <div
                    className="sticky left-0 bg-gray-50 dark:bg-gray-900/70 px-3 py-3 text-gray-700 dark:text-gray-200 font-medium border-b border-gray-200 dark:border-gray-800"
                    role="rowheader"
                  >
                    {feature}
                  </div>
                  {categories.map((category) => {
                    const value = row.get(category) ?? 0;
                    const color = getCellColor(value, minValue, maxValue);
                    return (
                      <div
                        key={`${feature}-${category}`}
                        className="relative flex items-center justify-center border-b border-gray-200 dark:border-gray-800 h-16 sm:h-20 transition-shadow hover:shadow-inner"
                        style={{ backgroundColor: color }}
                        title={`${feature} in ${category.replace(
                          /_/g,
                          " "
                        )}: ${value.toFixed(2)}`}
                        role="cell"
                      >
                        <span className="text-[0.8rem] sm:text-sm font-semibold text-gray-900 dark:text-white drop-shadow">
                          {value.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 text-xs text-gray-600 dark:text-gray-300">
          <span>Lower usage</span>
          <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-blue-100 via-blue-400 to-blue-800" />
          <span>Higher usage</span>
          <div className="hidden sm:flex gap-2">
            {legendStops.map((stop) => (
              <div
                key={stop}
                className="flex flex-col items-center text-[0.65rem] text-gray-500 dark:text-gray-400"
              >
                <span>{stop.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
        Higher intensity indicates larger average helper, map, program type, or
        attach point usage per repository.
      </p>
    </CollapsibleCard>
  );
}
