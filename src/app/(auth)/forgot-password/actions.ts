"use server";

import { prisma } from "@/server/db";
import { createPasswordResetToken } from "@/server/auth/passwordReset";
import { sendPasswordResetEmail } from "@/server/email";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export type ForgotPasswordState = {
  error?: string;
  // Set to true once a request has been processed. We always return the same
  // success message regardless of whether the email matched an account, so
  // attackers cannot enumerate which emails are registered.
  submitted?: boolean;
};

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  // We only send a reset email when the user exists AND has a password set
  // (OAuth-only accounts don't have a password to reset). In every other
  // case we still respond with "submitted" so the caller can't tell whether
  // the email is registered.
  if (user && user.passwordHash) {
    const token = await createPasswordResetToken(user.id);
    const base =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://voragoal.com";
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  }

  return { submitted: true };
}
