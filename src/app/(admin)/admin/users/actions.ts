"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { userRoleSchema } from "@/lib/validations/admin";

export async function updateRoleAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = userRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  // Belt-and-braces: never let an admin demote themselves to the last admin.
  if (parsed.data.userId === admin.id && parsed.data.role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new Error("You're the only ADMIN — promote someone else first.");
    }
  }
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const userId = String(formData.get("userId"));
  if (userId === admin.id) {
    throw new Error("You can't delete your own account from here.");
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}
