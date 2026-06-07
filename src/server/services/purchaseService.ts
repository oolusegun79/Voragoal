import { prisma } from "@/server/db";
import { TOURNAMENT_PASS } from "@/server/stripe";

/** Idempotent: writes a PENDING Purchase row keyed by Stripe session id. */
export async function recordPendingPurchase(args: {
  userId: string;
  stripeSessionId: string;
}) {
  return prisma.purchase.upsert({
    where: { stripeSessionId: args.stripeSessionId },
    update: {},
    create: {
      userId: args.userId,
      product: TOURNAMENT_PASS.product,
      amountCents: TOURNAMENT_PASS.amountCents,
      currency: TOURNAMENT_PASS.currency,
      status: "PENDING",
      stripeSessionId: args.stripeSessionId,
    },
  });
}

/**
 * Idempotent: marks the Purchase completed and flips hasTournamentPass on the User.
 * Called from the Stripe webhook on checkout.session.completed.
 */
export async function fulfillPurchase(args: {
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
}) {
  const purchase = await prisma.purchase.findUnique({
    where: { stripeSessionId: args.stripeSessionId },
  });
  if (!purchase) return null;
  if (purchase.status === "COMPLETED") return purchase;

  const now = new Date();
  await prisma.$transaction([
    prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
        stripePaymentIntentId: args.stripePaymentIntentId,
      },
    }),
    prisma.user.update({
      where: { id: purchase.userId },
      data: { hasTournamentPass: true, passPurchasedAt: now },
    }),
  ]);
  return prisma.purchase.findUnique({ where: { id: purchase.id } });
}
