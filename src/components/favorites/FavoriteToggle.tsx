"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "team" | "player" | "match";

const ENDPOINT: Record<Kind, (id: string) => string> = {
  team: (id) => `/api/favorites/teams/${id}`,
  player: (id) => `/api/favorites/players/${id}`,
  match: (id) => `/api/saved-matches/${id}`,
};

const LABEL: Record<Kind, { on: string; off: string }> = {
  team: { on: "Favorited", off: "Favorite" },
  player: { on: "Favorited", off: "Favorite" },
  match: { on: "Saved", off: "Save" },
};

export function FavoriteToggle({
  kind,
  id,
  initialFavorited,
  authenticated,
  size = "md",
}: {
  kind: Kind;
  id: string;
  initialFavorited: boolean;
  authenticated: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [favored, setFavored] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    const next = !favored;
    setFavored(next); // optimistic
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(ENDPOINT[kind](id), {
          method: next ? "POST" : "DELETE",
        });
        if (res.status === 402) {
          setFavored(!next);
          router.push("/pricing?from=favorite");
          return;
        }
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        router.refresh();
      } catch {
        setFavored(!next); // revert
        setError("Couldn't update. Try again.");
      }
    });
  }

  const labels = LABEL[kind];
  const isOn = favored;

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={isOn}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border px-3 transition",
          size === "sm" ? "h-8 text-xs" : "h-9 text-sm",
          isOn
            ? "border-warning/40 bg-warning/10 text-warning"
            : "border-border/80 bg-card/40 text-muted-foreground hover:text-foreground",
          pending && "opacity-60"
        )}
      >
        <Star
          className={cn(size === "sm" ? "size-3.5" : "size-4")}
          fill={isOn ? "currentColor" : "none"}
          aria-hidden
        />
        {isOn ? labels.on : labels.off}
      </button>
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
