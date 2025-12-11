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

export default function ProgramTypeDistribution({
  data,
}: {
  data: { programType: string; count: number }[];
}) {
  return (
    <Card title="Program Type Distribution">
      <div className="h-72 -m-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="programType"
              interval={0}
              angle={-25}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Repositories" fill={CHART_PALETTE[3]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
