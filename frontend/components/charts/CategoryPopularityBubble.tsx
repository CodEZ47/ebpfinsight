"use client";

import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CHART_PALETTE } from "@/components/ui";
import CollapsibleCard from "@/components/CollapsibleCard";

export interface CategoryPopularityDatum {
  category: string;
  repos: number;
  stars: number;
}

interface CategoryPopularityBubbleProps {
  data: CategoryPopularityDatum[];
}

export default function CategoryPopularityBubble({
  data,
}: CategoryPopularityBubbleProps) {
  const ordered = React.useMemo(
    () => [...data].sort((a, b) => b.repos - a.repos),
    [data]
  );

  const maxRepos = React.useMemo(
    () => Math.max(...ordered.map((d) => d.repos || 0), 1),
    [ordered]
  );
  const maxStars = React.useMemo(
    () => Math.max(...ordered.map((d) => d.stars || 0), 1),
    [ordered]
  );

  const renderTooltip = React.useCallback(
    ({ active, payload }: { active?: boolean; payload?: any[] }) => {
      if (!active || !payload || payload.length === 0) return null;
      const row = payload[0]?.payload as CategoryPopularityDatum | undefined;
      if (!row) return null;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-xs text-gray-900 dark:text-gray-100 space-y-1">
          <div className="font-semibold text-sm">{row.category}</div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-gray-500 dark:text-gray-400">
              Repositories
            </span>
            <span className="font-semibold">{row.repos}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-gray-500 dark:text-gray-400">
              Total Stars
            </span>
            <span className="font-semibold">{row.stars}</span>
          </div>
        </div>
      );
    },
    []
  );

  return (
    <CollapsibleCard
      title="Category Popularity"
      className="xl:col-span-2"
      collapsedContent={
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <p>Chart collapsed.</p>
          <p>
            Compare repository counts and total GitHub stars collected by
            category.
          </p>
        </div>
      }
    >
      <div className="h-[22rem] -m-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={ordered}
            layout="vertical"
            margin={{ top: 12, right: 32, bottom: 12, left: 12 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              xAxisId="repos"
              domain={[0, Math.ceil(maxRepos * 1.1)]}
              tick={{ fontSize: 12 }}
              label={{
                value: "Repositories",
                position: "insideBottom",
                offset: -4,
              }}
            />
            <XAxis
              type="number"
              xAxisId="stars"
              orientation="top"
              axisLine={false}
              tickLine={false}
              domain={[0, Math.ceil(maxStars * 1.1)]}
              tick={{ fontSize: 12 }}
              label={{
                value: "Total Stars",
                position: "insideTop",
                offset: -4,
              }}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={200}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              content={renderTooltip as any}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
            <Bar
              xAxisId="repos"
              dataKey="repos"
              name="Repositories"
              fill={CHART_PALETTE[1]}
              radius={[0, 4, 4, 0]}
              barSize={22}
            />
            <Line
              xAxisId="stars"
              dataKey="stars"
              name="Total Stars"
              type="monotone"
              stroke={CHART_PALETTE[3]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 1, fill: CHART_PALETTE[3] }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
        Bars show repository totals; the overlay line tracks cumulative stars
        per category.
      </p>
    </CollapsibleCard>
  );
}
