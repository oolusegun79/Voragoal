import { cn } from "@/lib/utils";

export function TeamCrest({
  flagEmoji,
  shortName,
  accentColor,
  size = "md",
}: {
  flagEmoji: string;
  shortName: string;
  accentColor?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { wrap: "gap-1.5 text-xs", emoji: "text-base" },
    md: { wrap: "gap-2 text-sm", emoji: "text-lg" },
    lg: { wrap: "gap-3 text-base", emoji: "text-2xl" },
  } as const;
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center", s.wrap)}>
      <span className={s.emoji} aria-hidden>
        {flagEmoji}
      </span>
      <span
        className="font-medium tracking-tight"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {shortName}
      </span>
    </span>
  );
}
