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

export default function HelperFrequencyBar({
  data,
}: {
  data: { helper: string; count: number }[];
}) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  return (
    <Card title="Helper Usage Frequency">
      <div className="h-72 -m-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="helper"
              interval={0}
              angle={-25}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Count" fill={CHART_PALETTE[1]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
