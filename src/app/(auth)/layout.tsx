import Link from "next/link";
import { Goal } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Goal className="size-5 text-primary" aria-hidden />
            <span>Voragoal</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center bg-hero-glow px-6 py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
