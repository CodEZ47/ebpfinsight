"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { CHART_PALETTE } from "@/components/ui";
import CollapsibleCard from "@/components/CollapsibleCard";

export interface CategoryDistributionDatum {
  category: string;
  count: number;
}

interface CategoryDistributionBarProps {
  data: CategoryDistributionDatum[];
}

export default function CategoryDistributionBar({
  data,
}: CategoryDistributionBarProps) {
  const sortedData = React.useMemo(
    () => [...data].sort((a, b) => b.count - a.count),
    [data]
  );

  const renderValueLabel = React.useCallback((props: any) => {
    const { x = 0, y = 0, width = 0, height = 0, value } = props;
    if (value === undefined || value === null) return null;
    return (
      <text
        x={x + width + 8}
        y={y + height / 2}
        className="fill-gray-700 dark:fill-gray-200 text-xs"
        dominantBaseline="middle"
      >
        {value}
      </text>
    );
  }, []);

  return (
    <CollapsibleCard title="Category Distribution" className="xl:col-span-1">
      <div className="h-72 -m-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 12, right: 24, bottom: 12, left: 12 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              label={{
                value: "Repositories",
                position: "insideBottom",
                offset: -8,
              }}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={190}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              formatter={(value: number) => [value, "Repositories"]}
            />
            <Bar dataKey="count" fill={CHART_PALETTE[0]} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="count" content={renderValueLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CollapsibleCard>
  );
}
