import Link from "next/link";
import { Goal, Sparkles } from "lucide-react";
import { auth } from "@/server/auth/config";
import { userHasPass } from "@/server/auth/access";
import { Footer } from "@/components/layout/Footer";
import { UpgradeBanner } from "@/components/paywall/UpgradeBanner";
import { MobileNav } from "@/components/layout/MobileNav";
import { NAV, ADMIN_LINK } from "@/components/layout/nav-items";

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
        <Link
          href={session?.user ? "/dashboard" : "/"}
          className="flex h-16 items-center gap-2 border-b border-border/60 px-6 font-semibold tracking-tight hover:text-primary"
        >
          <Goal className="size-5 text-primary" aria-hidden />
          Voragoal
        </Link>
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
              <span className="ml-auto flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground line-through">$7.99</span>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  $4.99
                </span>
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
              Save $3 — pre-kick-off price. Unlock AI summaries, favourites & saved matches.
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
        <MobileNav
          canAdmin={canAdmin}
          userLabel={session?.user?.name ?? session?.user?.email ?? null}
          userRole={session?.user?.role ?? null}
          showUpgrade={showUpgrade}
        />
        <UpgradeBanner />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
