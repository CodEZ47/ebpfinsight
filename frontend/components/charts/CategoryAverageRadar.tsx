"use client";
import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CHART_PALETTE } from "../ui";
import { formatCategoryDisplay } from "@/libs/analyticsUtils";

interface MultiCategoryRadarProps {
  data: {
    metric: string;
    repo?: number;
    [key: string]: number | string | undefined;
  }[];
  categories: string[];
  repoLabel: string;
}

export default function CategoryAverageRadar({
  data,
  categories,
  repoLabel,
}: MultiCategoryRadarProps) {
  const hasComparisons = categories.length > 0 && data.length > 0;
  const numberFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 1,
      }),
    []
  );

  return (
    <Card title="Category-Average Comparison (Radar)">
      <div className="h-72 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius={110}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis
              tickFormatter={(value) => numberFormatter.format(Number(value))}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                numberFormatter.format(Number(value ?? 0)),
                name,
              ]}
              cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
              verticalAlign="top"
              align="right"
            />
            <Radar
              name={repoLabel}
              dataKey="repo"
              stroke={CHART_PALETTE[1]}
              fill={CHART_PALETTE[1]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {hasComparisons &&
              categories.map((category, index) => {
                const paletteIndex = (index + 2) % CHART_PALETTE.length;
                return (
                  <Radar
                    key={category}
                    name={formatCategoryDisplay(category)}
                    dataKey={`cat_${category}`}
                    stroke={CHART_PALETTE[paletteIndex]}
                    fill={CHART_PALETTE[paletteIndex]}
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                );
              })}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
