"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LeaderboardRow } from "@/server/services/statsService";

type Metric = "goals" | "assists";

const EMPTY_COPY: Record<Metric, string> = {
  goals: "No goalscorers yet. Top scorers appear once matches finish.",
  assists: "No assists recorded yet. Top assists appear once matches finish.",
};

const BAR_FILL: Record<Metric, string> = {
  goals: "#22d3ee",
  assists: "#a78bfa",
};

export function TopScorersChart({
  data,
  metric = "goals",
  tall = false,
}: {
  data: LeaderboardRow[];
  metric?: Metric;
  /** Stretch the chart vertically — useful for the dedicated leaderboard page. */
  tall?: boolean;
}) {
  const heightClass = tall ? "min-h-[40rem] h-full" : "h-72";
  if (data.length === 0) {
    return (
      <div
        className={`flex ${heightClass} items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/40 text-center text-sm text-muted-foreground`}
      >
        <p className="max-w-xs px-4">{EMPTY_COPY[metric]}</p>
      </div>
    );
  }
  // Recharts vertical bar chart reads top-to-bottom; reverse so #1 is at the top.
  const padded = [...data].reverse();
  return (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={padded} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#1f2a44" }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip
            cursor={{ fill: "rgba(34,211,238,0.08)" }}
            contentStyle={{
              background: "#131a2e",
              border: "1px solid #1f2a44",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#f8fafc" }}
            itemStyle={{ color: "#ffffff" }}
            separator=""
            formatter={(value) => [`${value} ${metric}`, ""]}
          />
          <Bar dataKey="count" fill={BAR_FILL[metric]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
