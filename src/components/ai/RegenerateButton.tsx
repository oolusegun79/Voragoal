"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";

export function RegenerateButton({ path }: { path: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function regen() {
    setError(null);
    try {
      const res = await fetch(path, { method: "POST" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={regen}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/80 bg-card/40 px-3 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-60"
      >
        <RotateCcw className={`size-3.5 ${pending ? "animate-spin" : ""}`} aria-hidden />
        {pending ? "Generating…" : "Regenerate"}
      </button>
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
