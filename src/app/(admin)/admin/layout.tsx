import { requireRole } from "@/server/auth/guards";
import { AdminShell } from "@/components/layout/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("EDITOR");
  return <AdminShell user={user}>{children}</AdminShell>;
}
