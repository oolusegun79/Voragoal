"use server";

import { signIn } from "@/server/auth/config";

export async function signInWithGoogle(formData: FormData) {
  const redirectTo = (formData.get("redirectTo") as string | null) ?? "/dashboard";
  await signIn("google", { redirectTo });
}
