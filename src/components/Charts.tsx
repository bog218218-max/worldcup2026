"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
    <div className="panel h-72 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="oklch(0.295 0.015 163)" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="oklch(0.705 0.019 165)" />
          <YAxis stroke="oklch(0.705 0.019 165)" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.205 0.015 163)",
              border: "1px solid oklch(0.355 0.018 163)",
              borderRadius: 8
            }}
          />
          <Bar dataKey="value" isAnimationActive={false} radius={[6, 6, 0, 0]}>
            {data.map((item) => (
              <Cell key={item.name} fill={item.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProgressChart({ data }: { data: Array<Record<string, string | number>> }) {
  const keys = data.length > 0 ? Object.keys(data[0]).filter((key) => key !== "match") : [];
  const colors = [
    "oklch(0.74 0.145 148)",
    "oklch(0.79 0.115 86)",
    "oklch(0.69 0.095 218)",
    "oklch(0.66 0.145 28)",
    "oklch(0.68 0.08 135)",
    "oklch(0.85 0.1 100)",
    "oklch(0.65 0.15 300)",
    "oklch(0.70 0.1 50)",
    "oklch(0.75 0.1 200)",
    "oklch(0.60 0.15 25)"
  ];

  return (
    <div className="panel h-80 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="oklch(0.295 0.015 163)" strokeDasharray="3 3" />
          <XAxis dataKey="match" stroke="oklch(0.705 0.019 165)" />
          <YAxis stroke="oklch(0.705 0.019 165)" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.205 0.015 163)",
              border: "1px solid oklch(0.355 0.018 163)",
              borderRadius: 8
            }}
          />
          <Legend />
          {keys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              isAnimationActive={false}
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
