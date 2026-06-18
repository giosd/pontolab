"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/Card";
import { formatHours } from "@/lib/dates";
import type { HoursByDayItem } from "@/types";

const CHART_COLOR = "#38A8D8";

interface HoursByDayChartProps {
  data: HoursByDayItem[];
}

export function HoursByDayChart({ data }: HoursByDayChartProps) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-medium text-[#1E5F7A]">Horas por dia</h2>
      {data.length === 0 ? (
        <EmptyChartMessage />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D6EEF8" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#1E5F7A", fontSize: 12 }}
                axisLine={{ stroke: "#D6EEF8" }}
                tickLine={{ stroke: "#D6EEF8" }}
              />
              <YAxis
                tick={{ fill: "#38A8D8", fontSize: 12 }}
                axisLine={{ stroke: "#D6EEF8" }}
                tickLine={{ stroke: "#D6EEF8" }}
              />
              <Tooltip
                formatter={(value) => formatHours(Number(value))}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #D6EEF8",
                  backgroundColor: "#FFFFFF",
                }}
              />
              <Bar dataKey="hours" fill={CHART_COLOR} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function EmptyChartMessage() {
  return (
    <p className="flex h-64 items-center justify-center text-sm text-[#38A8D8]">
      Sem dados para exibir.
    </p>
  );
}
