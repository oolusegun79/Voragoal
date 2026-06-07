import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { auth } from "@/server/auth/config";

const ROLE_RANK: Record<Role, number> = {
  GUEST: 0,
  USER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

export type AuthorizedUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: Role;
};

/**
 * For route handlers. Returns either the authenticated, authorized user, or
 * a NextResponse that the caller should return immediately.
 */
export async function requireApiRole(
  min: Role
): Promise<AuthorizedUser | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Sign in required" } },
      { status: 401 }
    );
  }
  if (ROLE_RANK[session.user.role] < ROLE_RANK[min]) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Insufficient privileges" } },
      { status: 403 }
    );
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export function isAuthError(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}
