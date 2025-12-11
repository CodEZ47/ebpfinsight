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

export default function AttachPointFrequency({
  data,
}: {
  data: { attach: string; count: number }[];
}) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  return (
    <Card title="Attach-Point Frequency">
      <div className="h-72 -m-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="attach" type="category" width={160} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Count" fill={CHART_PALETTE[4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
