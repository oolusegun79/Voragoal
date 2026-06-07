import Link from "next/link";
import { Goal } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Goal className="size-5 text-primary" aria-hidden />
          <span>RealGoal</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link href="/matches" className="hover:text-foreground">Matches</Link>
          <Link href="/teams" className="hover:text-foreground">Teams</Link>
          <Link href="/standings" className="hover:text-foreground">Standings</Link>
          <Link href="/bracket" className="hover:text-foreground">Bracket</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
