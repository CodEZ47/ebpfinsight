"use client";
import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { Card, CHART_PALETTE } from "../ui";

type AttachHeatRow = {
  attach: string;
  [key: string]: number | string;
};
type HeatSeries = { key: string; label: string };

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export default function AttachPointsProgramTypesHeatmap({
  data,
  series,
}: {
  data: AttachHeatRow[];
  series: HeatSeries[];
}) {
  const hasData = data.length > 0 && series.length > 0;

  return (
    <Card title="Attach-Points vs Program Types (Heatmap Approximation)">
      <div className="h-80 -m-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(value) => numberFormatter.format(Number(value))}
              />
              <YAxis
                dataKey="attach"
                type="category"
                width={160}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  numberFormatter.format(Number(value ?? 0)),
                  name,
                ]}
                cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                layout="horizontal"
                verticalAlign="top"
                align="right"
              />
              {series.map((pt, i) => (
                <Bar
                  key={pt.key}
                  dataKey={pt.key}
                  name={pt.label}
                  stackId="heat"
                  fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                  radius={[6, 6, 6, 6]}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Select repositories with attach-point and program data to populate
            this heatmap.
          </div>
        )}
      </div>
    </Card>
  );
}
