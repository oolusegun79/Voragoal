"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Goal, Menu, X, Sparkles, LogOut } from "lucide-react";
import { NAV, ADMIN_LINK } from "./nav-items";
import { signOutAction } from "@/server/auth/logout-action";

export function MobileNav({
  canAdmin,
  userLabel,
  userRole,
  showUpgrade,
}: {
  canAdmin: boolean;
  userLabel: string | null;
  userRole: string | null;
  showUpgrade: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the user navigates.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border/60 px-4 lg:hidden">
        <Link
          href={userLabel ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Goal className="size-5 text-primary" aria-hidden />
          Voragoal
        </Link>
        <div className="flex items-center gap-2">
          {userLabel ? (
            <span className="truncate max-w-[140px] text-xs text-muted-foreground">{userLabel}</span>
          ) : (
            <Link href="/login" className="text-sm text-primary">
              Log in
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            className="rounded-md p-2 text-foreground hover:bg-card"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        id="mobile-nav-drawer"
        aria-label="Mobile navigation"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-border/60 bg-background shadow-2xl transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
          <Link
            href={userLabel ? "/dashboard" : "/"}
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <Goal className="size-5 text-primary" aria-hidden />
            Voragoal
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-2 text-foreground hover:bg-card"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition ${
                  active
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
          {canAdmin ? (
            <Link
              href={ADMIN_LINK.href}
              className="mt-2 flex items-center gap-3 rounded-md border border-accent/20 bg-accent/5 px-3 py-2.5 text-accent transition hover:bg-accent/10"
            >
              <ADMIN_LINK.icon className="size-4" aria-hidden />
              {ADMIN_LINK.label}
            </Link>
          ) : null}
        </nav>

        {showUpgrade ? (
          <Link
            href="/pricing"
            className="mx-3 mb-3 block rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-3 transition hover:from-primary/15 hover:to-accent/15"
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
              Save $3 — pre-kick-off price.
            </p>
          </Link>
        ) : null}

        <div className="border-t border-border/60 p-4 text-xs text-muted-foreground">
          {userLabel ? (
            <div className="space-y-2">
              <div>
                <p className="truncate text-foreground">{userLabel}</p>
                {userRole ? <p className="text-accent">{userRole}</p> : null}
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground transition hover:bg-card hover:text-foreground"
                >
                  <LogOut className="size-3.5" aria-hidden />
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="text-primary hover:underline">
              Log in →
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
