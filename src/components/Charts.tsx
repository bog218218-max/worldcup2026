"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function HitBreakdownChart({
  data
}: {
  data: Array<{ name: string; value: number; fill: string }>;
}) {
  return (
    <div className="h-72 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="oklch(0.34 0.025 205)" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="oklch(0.72 0.025 205)" />
          <YAxis stroke="oklch(0.72 0.025 205)" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.205 0.019 205)",
              border: "1px solid oklch(0.34 0.025 205)",
              borderRadius: 8
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProgressChart({ data }: { data: Array<Record<string, string | number>> }) {
  const keys = data.length > 0 ? Object.keys(data[0]).filter((key) => key !== "match") : [];
  const colors = ["#62d879", "#e4c35d", "#5cc7e8", "#e47668", "#a8e06f"];

  return (
    <div className="h-80 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="oklch(0.34 0.025 205)" strokeDasharray="3 3" />
          <XAxis dataKey="match" stroke="oklch(0.72 0.025 205)" />
          <YAxis stroke="oklch(0.72 0.025 205)" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.205 0.019 205)",
              border: "1px solid oklch(0.34 0.025 205)",
              borderRadius: 8
            }}
          />
          <Legend />
          {keys.slice(0, 5).map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
