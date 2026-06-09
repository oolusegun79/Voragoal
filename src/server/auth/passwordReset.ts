import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Create a fresh reset token for the given user. Returns the plaintext token
 * (to embed in the reset URL emailed to the user). Only a sha256 of the
 * token is stored in the DB, so a database compromise does not leak active
 * reset links.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return token;
}

/**
 * Validate a token from the URL and update the user's password. Returns
 * { ok: true } on success or { ok: false, reason } if the token is bad.
 * Tokens are one-time use — usedAt is set on success and rechecked here.
 */
export async function consumeResetTokenAndSetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const tokenHash = sha256(token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!row) return { ok: false, reason: "This reset link is invalid." };
  if (row.usedAt) return { ok: false, reason: "This reset link has already been used." };
  if (row.expiresAt < new Date()) {
    return { ok: false, reason: "This reset link has expired. Please request a new one." };
  }

  const passwordHash = await hashPassword(newPassword);

  // Use a transaction so the password update and token mark-as-used either
  // both succeed or both fail. Also invalidate any other outstanding reset
  // tokens for this user so an attacker who intercepted an old one can't
  // use it after the password change.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
