import Link from "next/link";
import { Goal, LayoutDashboard, ListChecks, ArrowLeft, Flag, Users, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

const ADMIN_NAV: Array<{ href: string; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }> = [
  { href: "/admin",         label: "Overview", icon: LayoutDashboard },
  { href: "/admin/matches", label: "Matches",  icon: ListChecks },
  { href: "/admin/teams",   label: "Teams",    icon: Flag },
  { href: "/admin/players", label: "Players",  icon: Users },
  { href: "/admin/users",   label: "Users",    icon: ShieldCheck, adminOnly: true },
];

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role: string };
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border/60 px-6 font-semibold tracking-tight">
          <Goal className="size-5 text-primary" aria-hidden />
          RealGoal
          <span className="ml-auto rounded bg-accent/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent">
            admin
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4 text-sm">
          {ADMIN_NAV.filter((n) => !n.adminOnly || user.role === "ADMIN").map(
            ({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-card hover:text-foreground"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            )
          )}
          <Link
            href="/dashboard"
            className="mt-4 flex items-center gap-3 rounded-md px-3 py-2 text-xs text-muted-foreground transition hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to app
          </Link>
        </nav>
        <div className="border-t border-border/60 p-4 text-xs text-muted-foreground">
          <p className="truncate text-foreground">{user.name ?? user.email}</p>
          <p className="text-accent">{user.role}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border/60 px-6 lg:hidden">
          <Link href="/admin" className="flex items-center gap-2 font-semibold tracking-tight">
            <Goal className="size-5 text-primary" aria-hidden />
            RealGoal Admin
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground">← App</Link>
        </header>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
