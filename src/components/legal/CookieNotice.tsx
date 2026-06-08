"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "voragoal:cookie-notice-acknowledged";

export function CookieNotice() {
  // Start hidden to avoid a hydration flash; reveal once we know localStorage state.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    setShown(true);
  }, []);

  if (!shown) return null;

  function acknowledge() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage blocked (private mode / settings) — still dismiss in-memory.
    }
    setShown(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/95 shadow-2xl backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center">
        <div className="flex items-start gap-2 sm:items-center">
          <Cookie className="mt-0.5 size-4 shrink-0 text-accent sm:mt-0" aria-hidden />
          <p className="text-muted-foreground">
            Voragoal uses essential cookies to keep you signed in. We do not use tracking or advertising cookies.{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Learn more
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={acknowledge}
          className="ml-auto inline-flex h-8 shrink-0 items-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          OK, got it
        </button>
      </div>
    </div>
  );
}
