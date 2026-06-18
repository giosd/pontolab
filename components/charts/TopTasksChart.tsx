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
import type { TopTaskItem } from "@/types";

interface TopTasksChartProps {
  data: TopTaskItem[];
}

export function TopTasksChart({ data }: TopTasksChartProps) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-medium text-[#1E5F7A]">
        Tarefas com mais horas
      </h2>
      {data.length === 0 ? (
        <EmptyChartMessage />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D6EEF8" />
              <XAxis type="number" tick={{ fill: "#38A8D8", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="task"
                width={120}
                tick={{ fill: "#1E5F7A", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => formatHours(Number(value))}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #D6EEF8",
                  backgroundColor: "#FFFFFF",
                }}
              />
              <Bar dataKey="hours" fill="#1E5F7A" radius={[0, 8, 8, 0]} />
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
