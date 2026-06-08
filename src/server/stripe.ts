import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local before charging users."
    );
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const TOURNAMENT_PASS = {
  product: "tournament_pass" as const,
  name: "Voragoal Tournament Pass",
  description:
    "Full access to AI match summaries, favourite teams & players, and saved matches for the 2026 FIFA World Cup.",
  amountCents: 499,
  currency: "usd",
};
