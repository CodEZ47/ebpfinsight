"use client";
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  Cell,
} from "recharts";
import { Card, CHART_PALETTE } from "../ui";

type PreparedDatum = {
  type: string;
  count: number;
  percent: number;
  color: string;
  shortLabel: string;
  isOther?: boolean;
};

const MAX_SEGMENTS = 12;

export default function MapTypeDistribution({
  data,
}: {
  data: { type: string; count: number }[];
}) {
  const prepared = React.useMemo<PreparedDatum[]>(() => {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    const visible: Array<{
      type: string;
      count: number;
      isOther?: boolean;
    }> = sorted.slice(0, MAX_SEGMENTS - 1).map((item) => ({ ...item }));
    const remainder = sorted.slice(MAX_SEGMENTS - 1);
    const remainderTotal = remainder.reduce((sum, item) => sum + item.count, 0);
    if (remainderTotal > 0) {
      visible.push({ type: "Other", count: remainderTotal, isOther: true });
    }
    return visible.map((item, idx) => ({
      ...item,
      percent: +((item.count / total) * 100).toFixed(1),
      color: item.isOther
        ? "#94a3b8"
        : CHART_PALETTE[idx % CHART_PALETTE.length],
      shortLabel:
        item.type.length > 22 ? `${item.type.slice(0, 20)}…` : item.type,
    }));
  }, [data]);

  const renderTooltip = React.useCallback(
    ({ active, payload }: { active?: boolean; payload?: any[] }) => {
      if (!active || !payload || payload.length === 0) return null;
      const row = payload[0]?.payload as PreparedDatum | undefined;
      if (!row) return null;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-xs text-gray-900 dark:text-gray-100 space-y-1">
          <div className="font-semibold text-sm">{row.type}</div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-500 dark:text-gray-400">Maps</span>
            <span className="font-semibold">{row.count}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-gray-500 dark:text-gray-400">Share</span>
            <span className="font-semibold">{row.percent}%</span>
          </div>
        </div>
      );
    },
    []
  );

  return (
    <Card title="Map Type Distribution">
      <div className="h-[22rem] -m-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={prepared}
            layout="vertical"
            margin={{ top: 12, right: 28, bottom: 12, left: 12 }}
            barCategoryGap={10}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              label={{
                value: "Map count",
                position: "insideBottom",
                offset: -4,
              }}
            />
            <YAxis
              type="category"
              dataKey="shortLabel"
              tick={{ fontSize: 12 }}
              width={210}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              content={renderTooltip as any}
            />
            <Legend
              align="right"
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "12px" }}
              payload={prepared.map((item) => ({
                id: item.type,
                type: "circle" as const,
                value: item.shortLabel,
                color: item.color,
              }))}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {prepared.map((item) => (
                <Cell key={item.type} fill={item.color} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                content={(props) => {
                  const { x, y, width, height, value } = props as any;
                  if (typeof x !== "number" || typeof y !== "number")
                    return null;
                  const displayValue = Array.isArray(value) ? value[0] : value;
                  const textX = x + (width || 0) + 8;
                  const barHeight =
                    typeof height === "number" ? height : Number(height ?? 0);
                  const textY = y + barHeight / 2;
                  const datum = (props as any).payload as
                    | PreparedDatum
                    | undefined;
                  const share = datum ? datum.percent : 0;
                  return (
                    <text
                      x={textX}
                      y={textY}
                      fontSize={12}
                      fill="#334155"
                      dominantBaseline="middle"
                    >
                      {`${displayValue} (${share}%)`}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
        Shows the most common map implementations across the selected repos. Any
        remaining types are combined as Other.
      </p>
    </Card>
  );
}
