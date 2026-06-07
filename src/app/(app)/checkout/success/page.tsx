import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { auth } from "@/server/auth/config";
import { getStripe, isStripeConfigured } from "@/server/stripe";
import { fulfillPurchase } from "@/server/services/purchaseService";
import { userHasPass } from "@/server/auth/access";

export const dynamic = "force-dynamic";

/**
 * Stripe will fire the webhook independently, but the user lands here first.
 * Best-effort: fetch the session and fulfil immediately so the rest of the
 * site reflects their access on the next click. Webhook is still source of truth.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const session = await auth();

  if (session_id && isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const stripeSession = await stripe.checkout.sessions.retrieve(session_id);
      if (stripeSession.payment_status === "paid") {
        const paymentIntentId =
          typeof stripeSession.payment_intent === "string"
            ? stripeSession.payment_intent
            : stripeSession.payment_intent?.id ?? null;
        await fulfillPurchase({
          stripeSessionId: stripeSession.id,
          stripePaymentIntentId: paymentIntentId,
        });
      }
    } catch {
      // ignore — webhook will fulfil if this path failed
    }
  }

  const hasPass = await userHasPass(session?.user?.id);

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <CircleCheck className="mx-auto size-12 text-success" />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">You're in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasPass
          ? "Your Tournament Pass is active. AI summaries and favourites are unlocked."
          : "Payment received. Your access will activate within a few seconds — refresh if you don't see it yet."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to dashboard
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
