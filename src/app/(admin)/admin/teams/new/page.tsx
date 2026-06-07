import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TeamForm } from "@/components/admin/TeamForm";

export default function NewTeamPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href="/admin/teams"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All teams
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">New team</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Use a 2–4 letter code (ISO-3 if possible). Color powers accent borders across the app.
      </p>

      <div className="mt-6 rounded-xl border border-border/60 bg-card p-6">
        <TeamForm />
      </div>
    </div>
  );
}
