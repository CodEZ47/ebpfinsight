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

// Note: This uses co-occurrence approximation due to data limitations.
type HelperHeatRow = { helper: string } & Record<string, number>;
export default function HelpersProgramTypesHeatmap({
  data,
}: {
  data: HelperHeatRow[];
}) {
  const programTypes = Array.from(
    data.reduce((s, row) => {
      Object.keys(row).forEach((k) => {
        if (k !== "helper") s.add(k);
      });
      return s;
    }, new Set<string>())
  );
  return (
    <Card title="Helpers vs Program Types (Heatmap Approximation)">
      <div className="h-80 -m-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="helper" type="category" width={160} />
            <Tooltip />
            <Legend />
            {programTypes.map((pt, i) => (
              <Bar
                key={pt}
                dataKey={pt}
                stackId="heat"
                fill={CHART_PALETTE[i % CHART_PALETTE.length]}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
