import Link from "next/link";
import { XCircle } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <XCircle className="mx-auto size-12 text-muted-foreground" />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Checkout cancelled</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No charge was made. Free access still works — you can browse the schedule, teams,
        and standings anytime.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/pricing"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to pricing
        </Link>
        <Link
          href="/matches"
          className="inline-flex h-10 items-center rounded-md border border-border/60 px-4 text-sm font-medium hover:bg-card-muted"
        >
          Browse fixtures
        </Link>
      </div>
    </div>
  );
}
