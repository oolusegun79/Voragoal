import Link from "next/link";
import { Goal, LayoutDashboard, CalendarDays, Flag, Trophy, GitBranch, User as UserIcon, Wrench } from "lucide-react";
import { auth } from "@/server/auth/config";
import { Footer } from "@/components/layout/Footer";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches",   label: "Matches",   icon: CalendarDays },
  { href: "/teams",     label: "Teams",     icon: Flag },
  { href: "/standings", label: "Standings", icon: Trophy },
  { href: "/bracket",   label: "Bracket",   icon: GitBranch },
  { href: "/profile",   label: "Profile",   icon: UserIcon },
];

const ADMIN_LINK = { href: "/admin", label: "Admin", icon: Wrench };

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const canAdmin = session?.user?.role === "EDITOR" || session?.user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border/60 px-6 font-semibold tracking-tight">
          <Goal className="size-5 text-primary" aria-hidden />
          RealGoal
        </div>
        <nav className="flex-1 space-y-1 p-4 text-sm">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-card hover:text-foreground"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
          {canAdmin ? (
            <Link
              href={ADMIN_LINK.href}
              className="mt-2 flex items-center gap-3 rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-accent transition hover:bg-accent/10"
            >
              <ADMIN_LINK.icon className="size-4" aria-hidden />
              {ADMIN_LINK.label}
            </Link>
          ) : null}
        </nav>
        <div className="border-t border-border/60 p-4 text-xs text-muted-foreground">
          {session?.user ? (
            <div>
              <p className="truncate text-foreground">{session.user.name ?? session.user.email}</p>
              <p className="text-accent">{session.user.role}</p>
            </div>
          ) : (
            <Link href="/login" className="text-primary hover:underline">
              Log in →
            </Link>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border/60 px-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Goal className="size-5 text-primary" aria-hidden />
            RealGoal
          </Link>
          {session?.user ? (
            <span className="text-xs text-muted-foreground">{session.user.email}</span>
          ) : (
            <Link href="/login" className="text-sm text-primary">Log in</Link>
          )}
        </header>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
