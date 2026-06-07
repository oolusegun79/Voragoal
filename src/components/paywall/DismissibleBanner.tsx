"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const DISMISS_KEY = "realgoal:upgrade-banner-dismissed";
const HIDE_ON = ["/pricing", "/checkout/success", "/checkout/cancel"];

export function DismissibleBanner() {
  // Start hidden to avoid a hydration flash; reveal in useEffect once we know
  // sessionStorage state.
  const [hidden, setHidden] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    setHidden(false);
  }, []);

  if (hidden) return null;
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  }

  return (
    <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Sparkles className="size-4 shrink-0 text-accent" aria-hidden />
          <span className="truncate">
            <span className="font-medium">Unlock AI summaries & favourites</span>
            <span className="hidden text-muted-foreground sm:inline"> — one-time $4.99 for the whole tournament.</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/pricing"
            className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Get the pass
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
