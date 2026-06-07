import Link from "next/link";
import { Goal, LayoutDashboard, CalendarDays, Flag, Trophy, GitBranch, User as UserIcon, Wrench, Sparkles } from "lucide-react";
import { auth } from "@/server/auth/config";
import { userHasPass } from "@/server/auth/access";
import { Footer } from "@/components/layout/Footer";
import { UpgradeBanner } from "@/components/paywall/UpgradeBanner";

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

  let showUpgrade = false;
  if (session?.user?.id) {
    try {
      showUpgrade = !(await userHasPass(session.user.id));
    } catch (err) {
      console.error("[AppShell] userHasPass failed:", err);
      showUpgrade = false;
    }
  }

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
        {showUpgrade ? (
          <Link
            href="/pricing"
            className="mx-4 mb-4 block rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-3 transition hover:from-primary/15 hover:to-accent/15"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden />
              <span className="text-sm font-semibold text-primary">Tournament Pass</span>
              <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                $4.99
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
              Unlock AI summaries, favourites & saved matches for the whole World Cup.
            </p>
          </Link>
        ) : null}
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
        <UpgradeBanner />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
