"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ResultsSplit } from "@/server/services/statsService";
import { useIsMounted } from "@/lib/use-is-mounted";

export function ResultsDonut({ data }: { data: ResultsSplit }) {
  const mounted = useIsMounted();
  const total = data.wins + data.draws;
  if (total === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/40 text-center text-sm text-muted-foreground">
        <p className="max-w-xs px-4">No results yet. Match outcomes appear here as games finish.</p>
      </div>
    );
  }
  const chartData = [
    { name: "Decisive", value: data.wins, fill: "#22c55e" },
    { name: "Draw", value: data.draws, fill: "#fbbf24" },
  ];
  if (!mounted) return <div className="h-72 w-full" aria-hidden />;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#131a2e",
              border: "1px solid #1f2a44",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#f8fafc" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
