export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-card-muted/60" />
        <div className="h-4 w-72 animate-pulse rounded bg-card-muted/40" />
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg border border-border/60 bg-card/60"
          />
        ))}
      </div>
    </div>
  );
}
