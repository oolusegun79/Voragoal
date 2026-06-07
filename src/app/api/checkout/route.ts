import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { getStripe, isStripeConfigured, TOURNAMENT_PASS } from "@/server/stripe";
import { userHasPass } from "@/server/auth/access";
import { recordPendingPurchase } from "@/server/services/purchaseService";

function appUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Sign in required" } }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: { message: "Payments are not configured yet." } },
      { status: 503 }
    );
  }
  if (await userHasPass(session.user.id)) {
    return NextResponse.json(
      { error: { message: "You already have the tournament pass." } },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: session.user.email ?? undefined,
    client_reference_id: session.user.id,
    metadata: { userId: session.user.id, product: TOURNAMENT_PASS.product },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: TOURNAMENT_PASS.currency,
          unit_amount: TOURNAMENT_PASS.amountCents,
          product_data: {
            name: TOURNAMENT_PASS.name,
            description: TOURNAMENT_PASS.description,
          },
        },
      },
    ],
    success_url: `${appUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/checkout/cancel`,
  });

  if (!checkout.url) {
    return NextResponse.json(
      { error: { message: "Stripe didn't return a checkout URL." } },
      { status: 500 }
    );
  }

  await recordPendingPurchase({ userId: session.user.id, stripeSessionId: checkout.id });

  return NextResponse.json({ url: checkout.url });
}
