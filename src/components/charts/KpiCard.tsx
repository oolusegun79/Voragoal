import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: "primary" | "accent" | "success" | "warning";
}) {
  const accentClass =
    accent === "primary" ? "text-primary"
      : accent === "accent" ? "text-accent"
      : accent === "success" ? "text-success"
      : accent === "warning" ? "text-warning"
      : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon ? <Icon className={cn("size-4", accentClass)} aria-hidden /> : null}
      </div>
      <p className={cn("mt-2 font-mono text-3xl font-semibold tabular-nums", accentClass)}>
        {value}
      </p>
      {sublabel ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">{sublabel}</p>
      ) : null}
    </div>
  );
}
