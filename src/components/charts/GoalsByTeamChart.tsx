"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import type { GoalsByTeam } from "@/server/services/statsService";

export function GoalsByTeamChart({ data }: { data: GoalsByTeam[] }) {
  if (data.length === 0) {
    return (
      <EmptyChart message="No goals scored yet. Comes alive once matches finish." />
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="shortName"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#1f2a44" }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(29,155,240,0.08)" }}
            contentStyle={{
              background: "#131a2e",
              border: "1px solid #1f2a44",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#f8fafc" }}
            itemStyle={{ color: "#ffffff" }}
            separator=""
            formatter={(value) => [`${value} goals`, ""]}
          />
          <Bar dataKey="goals" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.teamId} fill={d.accentColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/40 text-center text-sm text-muted-foreground">
      <p className="max-w-xs px-4">{message}</p>
    </div>
  );
}
