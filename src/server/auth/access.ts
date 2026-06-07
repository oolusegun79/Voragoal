import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth/config";

/**
 * Source of truth: DB column. Avoids JWT staleness when a user just bought a pass.
 * One indexed lookup per call — fine for our gating volume.
 */
export async function userHasPass(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasTournamentPass: true, role: true },
  });
  if (!row) return false;
  // EDITORs and ADMINs get the pass for free — they're staff.
  if (row.role === "EDITOR" || row.role === "ADMIN") return true;
  return row.hasTournamentPass;
}

/** RSC/page guard. Redirects unauthenticated → /login, unpaid → /pricing. */
export async function requirePass(returnTo?: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login${returnTo ? `?from=${encodeURIComponent(returnTo)}` : ""}`);
  }
  const ok = await userHasPass(session.user.id);
  if (!ok) {
    redirect(`/pricing${returnTo ? `?from=${encodeURIComponent(returnTo)}` : ""}`);
  }
  return session.user;
}
