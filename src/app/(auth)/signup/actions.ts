"use server";

import { AuthError } from "next-auth";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { signIn } from "@/server/auth/config";
import { signupSchema } from "@/lib/validations/auth";

export type SignupState = { error?: string };

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: { email, name: parsed.data.name, passwordHash },
    select: { id: true },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/pricing?welcome=1",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      // Should not happen — we just created the user.
      return { error: "Account created, but sign-in failed. Please log in manually." };
    }
    throw err;
  }
}
