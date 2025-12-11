"use client";
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { Card, CHART_PALETTE } from "../ui";

export default function RepoComplexityHistogram({
  data,
}: {
  data: { bin: string; count: number }[];
}) {
  return (
    <Card title="Repo Complexity Histogram (Programs per Repo)">
      <div className="h-72 -m-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Repositories" fill={CHART_PALETTE[5]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
