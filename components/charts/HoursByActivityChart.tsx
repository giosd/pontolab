"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/Card";
import { formatHours } from "@/lib/dates";
import type { HoursByActivityItem } from "@/types";

const COLORS = ["#38A8D8", "#7CC7E8", "#1E5F7A", "#5BB8E0", "#A8DFF0", "#2B8CB0"];

interface HoursByActivityChartProps {
  data: HoursByActivityItem[];
}

export function HoursByActivityChart({ data }: HoursByActivityChartProps) {
  const usePie = data.length <= 6;

  return (
    <Card>
      <h2 className="mb-4 text-base font-medium text-[#1E5F7A]">
        Horas por atividade
      </h2>
      {data.length === 0 ? (
        <EmptyChartMessage />
      ) : usePie ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="hours"
                nameKey="activity"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name} (${Math.round((percent ?? 0) * 100)}%)`
                }
              >
                {data.map((entry, index) => (
                  <Cell key={entry.activity} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatHours(Number(value))}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #D6EEF8",
                  backgroundColor: "#FFFFFF",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
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
                dataKey="activity"
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
              <Bar dataKey="hours" fill="#38A8D8" radius={[0, 8, 8, 0]} />
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
