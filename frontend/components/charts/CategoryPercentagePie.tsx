"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_PALETTE } from "@/components/ui";
import CollapsibleCard from "@/components/CollapsibleCard";

export interface CategoryPercentageDatum {
  name: string;
  value: number;
}

interface CategoryPercentagePieProps {
  data: CategoryPercentageDatum[];
}

export default function CategoryPercentagePie({
  data,
}: CategoryPercentagePieProps) {
  const processed = React.useMemo(() => {
    const filtered = (data || [])
      .filter((item) => Number(item.value) > 0)
      .map((item) => ({
        name: item.name,
        value: Number(item.value.toFixed(2)),
      }));
    if (!filtered.length) return [] as CategoryPercentageDatum[];

    const sorted = [...filtered].sort((a, b) => b.value - a.value);
    const MAX_SLICES = 7;
    if (sorted.length <= MAX_SLICES) return sorted;

    const head = sorted.slice(0, MAX_SLICES);
    const tailTotal = sorted
      .slice(MAX_SLICES)
      .reduce((acc, item) => acc + item.value, 0);
    if (tailTotal > 0.5) {
      head.push({ name: "Other", value: Number(tailTotal.toFixed(2)) });
    }
    return head;
  }, [data]);

  const palette = React.useMemo(
    () => processed.map((_, idx) => CHART_PALETTE[idx % CHART_PALETTE.length]),
    [processed]
  );

  const [activeIndex, setActiveIndex] = React.useState(0);
  React.useEffect(() => {
    if (processed.length === 0) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= processed.length) {
      setActiveIndex(0);
    }
  }, [processed, activeIndex]);

  const activeSlice = processed[activeIndex];
  const total = processed.reduce((acc, item) => acc + item.value, 0);

  return (
    <CollapsibleCard
      title="Category Percentage Share"
      className="xl:col-span-1"
      collapsedContent={
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Chart collapsed.
        </p>
      }
    >
      {processed.length === 0 ? (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          No category share data available yet.
        </p>
      ) : (
        <div className="h-72 -m-2 flex flex-col lg:flex-row items-center gap-6 px-4">
          <div className="relative w-full lg:flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processed}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={processed.length > 1 ? 2 : 0}
                  strokeWidth={1.5}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                >
                  {processed.map((slice, idx) => (
                    <Cell
                      key={slice.name}
                      fill={palette[idx]}
                      stroke={palette[idx]}
                      opacity={activeIndex === idx ? 0.95 : 0.55}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)}%`,
                    "Share",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {activeSlice && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Selected
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center px-2">
                  {activeSlice.name}
                </span>
                <span className="text-base font-semibold text-brand">
                  {activeSlice.value.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="w-full lg:w-52">
            <ul className="space-y-2 text-sm">
              {processed.map((slice, idx) => (
                <li
                  key={slice.name}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center justify-between gap-3 rounded px-2 py-1 transition-colors cursor-pointer ${
                    activeIndex === idx
                      ? "bg-brand/10 text-brand"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: palette[idx] }}
                    />
                    <span className="truncate" title={slice.name}>
                      {slice.name}
                    </span>
                  </div>
                  <span className="font-semibold shrink-0">
                    {slice.value.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
            {Math.abs(total - 100) > 0.5 && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Percentages are rounded; totals may not equal 100%.
              </p>
            )}
          </div>
        </div>
      )}
    </CollapsibleCard>
  );
}
