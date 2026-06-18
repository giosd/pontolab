"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/Card";
import { formatSignedHours } from "@/lib/dates";

const CHART_COLOR = "#38A8D8";

interface BalanceChartProps {
  data: { date: string; label: string; balance: number }[];
  title?: string;
}

export function BalanceChart({
  data,
  title = "Saldo acumulado por dia",
}: BalanceChartProps) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-medium text-[#1E5F7A]">{title}</h2>
      {data.length === 0 ? (
        <p className="flex h-64 items-center justify-center text-sm text-[#38A8D8]">
          Sem dados para exibir.
        </p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                formatter={(value) => formatSignedHours(Number(value))}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #D6EEF8",
                  backgroundColor: "#FFFFFF",
                }}
              />
              <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="balance"
                stroke={CHART_COLOR}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
