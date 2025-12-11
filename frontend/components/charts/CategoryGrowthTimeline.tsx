"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_PALETTE } from "@/components/ui";
import CollapsibleCard from "@/components/CollapsibleCard";

export interface CategoryGrowthTimelineDatum {
  year: number;
  [category: string]: number | string;
}

interface CategoryGrowthTimelineProps {
  data: CategoryGrowthTimelineDatum[];
}

export default function CategoryGrowthTimeline({
  data,
}: CategoryGrowthTimelineProps) {
  const categories = React.useMemo(() => {
    if (!data.length) return [] as string[];
    const keys = Object.keys(data[0]).filter((key) => key !== "year");
    return keys;
  }, [data]);

  const palette = React.useMemo(
    () => categories.map((_, idx) => CHART_PALETTE[idx % CHART_PALETTE.length]),
    [categories]
  );

  return (
    <CollapsibleCard
      title="Category Growth Over Time"
      className="xl:col-span-2"
      collapsedContent={
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <p>Chart collapsed.</p>
          <p>
            Lines track cumulative repositories per category each year; hover to
            compare totals.
          </p>
        </div>
      }
    >
      <div className="h-80 -m-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
              allowDecimals={false}
            />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip labelFormatter={(value) => `Year ${value}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {categories.map((category, index) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={palette[index]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
        Lines track cumulative repositories per category each year; hover to
        compare totals.
      </p>
    </CollapsibleCard>
  );
}
