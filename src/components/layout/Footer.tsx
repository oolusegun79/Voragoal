import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Voragoal.{" "}
          <span className="text-foreground/80">
            Operated by FirstData Consulting LLC. An independent analytics platform — not affiliated with, endorsed by, or sponsored by FIFA.
          </span>
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
