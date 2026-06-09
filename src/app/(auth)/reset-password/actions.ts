"use server";

import { consumeResetTokenAndSetPassword } from "@/server/auth/passwordReset";
import { resetPasswordSchema } from "@/lib/validations/auth";

export type ResetPasswordState = {
  error?: string;
  success?: boolean;
};

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await consumeResetTokenAndSetPassword(
    parsed.data.token,
    parsed.data.password,
  );
  if (!result.ok) {
    return { error: result.reason };
  }

  return { success: true };
}
