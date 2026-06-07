import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { SubjectType } from "@prisma/client";
import { auth } from "@/server/auth/config";
import { getSummary } from "@/server/ai/aiSummaryService";
import { isAiConfigured } from "@/server/ai/anthropic";
import { RegenerateButton } from "@/components/ai/RegenerateButton";

export async function AiSummaryCard({
  subjectType,
  subjectId,
  title = "AI summary",
  description = "Generated from the data on this page. No betting language, ever.",
}: {
  subjectType: SubjectType;
  subjectId: string;
  title?: string;
  description?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return (
      <Card title={title} description={description}>
        <p className="rounded-lg border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">Sign in</a>{" "}
          to view AI-generated insights.
        </p>
      </Card>
    );
  }

  if (!isAiConfigured()) {
    return (
      <Card title={title} description={description}>
        <p className="rounded-lg border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
          AI insights aren't configured for this environment.{" "}
          <code className="rounded bg-card-muted px-1.5 py-0.5 text-xs">ANTHROPIC_API_KEY</code>{" "}
          is missing.
        </p>
      </Card>
    );
  }

  const result = await getSummary(subjectType, subjectId);
  const canRegen = session.user.role === "EDITOR" || session.user.role === "ADMIN";

  const path =
    subjectType === "MATCH"  ? `/api/ai/match-summary/${subjectId}/regenerate`
    : subjectType === "TEAM"   ? null
    : subjectType === "PLAYER" ? null
    : null;

  return (
    <Card
      title={title}
      description={description}
      action={
        canRegen && path ? (
          <RegenerateButton path={path} />
        ) : null
      }
    >
      <article className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed text-foreground/90">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            a: () => <span className="text-muted-foreground">[link removed]</span>,
            // Strip any script/html that slipped through; react-markdown ignores
            // raw HTML by default in v10 unless rehype-raw is configured.
          }}
        >
          {result.contentMd}
        </ReactMarkdown>
      </article>
      <p className="mt-4 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Sparkles className="size-3 text-accent" aria-hidden />
        {result.cached ? "Cached" : "Just generated"} · {result.modelId}
        {result.generated === "skipped_live" ? " · Live — refreshes at HT and FT" : ""}
        {result.generated === "fallback" ? " · Fell back to template" : ""}
      </p>
    </Card>
  );
}

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" aria-hidden />
          <div>
            <h3 className="text-sm font-medium tracking-tight">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
