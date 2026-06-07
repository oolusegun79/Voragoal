"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * When the parent match is LIVE, refresh the route every 15s to pick up new
 * events, score, and clock. We stop polling as soon as status flips to
 * FINISHED (the next refresh after the transition is automatic).
 */
export function LiveScorePoller({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "LIVE") return;
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [status, router]);

  return null;
}
