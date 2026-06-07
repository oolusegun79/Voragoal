import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/server/auth/config";

const ROLE_RANK: Record<Role, number> = {
  GUEST: 0,
  USER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/**
 * Use in RSC layouts/pages or route handlers. Redirects to /login when
 * unauthenticated; throws a Response(403) when authenticated but underprivileged.
 */
export async function requireRole(min: Role) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (ROLE_RANK[session.user.role] < ROLE_RANK[min]) {
    throw new Response("Forbidden", { status: 403 });
  }
  return session.user;
}
