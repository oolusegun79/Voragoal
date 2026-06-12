"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { trackTikTok } from "@/lib/tiktok";

export function CheckoutButton({
  authenticated,
  alreadyPaid,
}: {
  authenticated: boolean;
  alreadyPaid: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (alreadyPaid) {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        ✓ You already have the Tournament Pass. Enjoy the World Cup.
      </div>
    );
  }
  if (!authenticated) {
    return (
      <a
        href="/login?from=/pricing"
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Sign in to buy — $4.99
      </a>
    );
  }

  function buy() {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/checkout", { method: "POST" });
        const data = (await res.json()) as { url?: string; error?: { message: string } };
        if (!res.ok || !data.url) {
          setError(data.error?.message ?? "Checkout failed. Try again.");
          return;
        }
        // Funnel-top signal for TikTok ad optimization.
        trackTikTok("InitiateCheckout", {
          value: 4.99,
          currency: "USD",
          content_id: "tournament_pass",
          content_type: "product",
        });
        // The pixel beacon dispatches asynchronously. Without this short
        // delay the browser sometimes navigates to Stripe before the
        // request reaches analytics.tiktok.com, and TikTok never records
        // the event. 250ms is below the human-perceptible threshold and
        // enough time for the beacon to flush.
        await new Promise((r) => setTimeout(r, 250));
        window.location.href = data.url;
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={buy}
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Redirecting to checkout…" : "Buy Tournament Pass — $4.99"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
