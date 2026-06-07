import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

export function PaywallCard({
  title = "Unlock with the Tournament Pass",
  body = "AI insights, favourites, and saved matches are part of the $4.99 Tournament Pass.",
  cta = "Get the pass — $4.99",
}: {
  title?: string;
  body?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-card to-accent/5 p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-accent/15 p-2 text-accent">
          <Lock className="size-4" />
        </span>
        <div className="flex-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="size-3.5 text-accent" />
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
