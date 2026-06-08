import Link from "next/link";
import { Goal } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Goal className="size-5 text-primary" aria-hidden />
            Voragoal
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center bg-hero-glow px-6 py-16 text-center">
        <div className="max-w-md">
          <p className="font-mono text-7xl font-bold text-primary">404</p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            That URL doesn't match anything in the tournament data. Try the matches list or jump to the dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/matches"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Browse matches
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-border/80 bg-card/40 px-4 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
