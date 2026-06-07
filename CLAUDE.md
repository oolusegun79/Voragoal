# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Heed the agent rules first

This project uses **Next.js 16** and **Prisma 7**, both of which have breaking changes versus older training data. The repo ships [AGENTS.md](AGENTS.md) explicitly warning to read `node_modules/next/dist/docs/` before writing Next.js code. Do that. Heed deprecation notices.

## Product non-negotiables

These come from the product brief and the plan, not from code review preferences:

1. **No betting / odds / wagering / prediction-market language anywhere** — not in UI copy, not in AI summaries, not in marketing. The AI service enforces this with a server-side denylist regex; do not weaken or remove it.
2. **No FIFA branding or trademarked crests.** Teams are represented by 3-letter code + flag emoji + accent color. The footer disclaimer ("not affiliated with, endorsed by, or sponsored by FIFA") must render on every page.
3. **Focus is the 2026 FIFA World Cup specifically.** Not multi-tournament, not historical. Schema and seed data are scoped accordingly.

## Commands

```bash
pnpm dev                          # http://localhost:3000
pnpm build                        # production build (regenerates Next route types)
pnpm typecheck                    # tsc --noEmit
pnpm lint                         # eslint

pnpm prisma migrate dev --name X  # create + apply a migration
pnpm db:seed                      # idempotent upsert of prisma/seed-data/*.json
pnpm db:studio                    # Prisma Studio (table browser)

pnpm tsx scripts/make-admin.ts user@example.com   # promote a USER → ADMIN
```

There are no unit/e2e tests yet — Playwright is intentionally deferred until CI is set up. `pnpm typecheck` and `pnpm build` are the green/red signal.

## Architecture — the non-obvious parts

### Routing & shells

Three route groups under `src/app/`:
- `(auth)/` — `/login`, `/signup` with a centered card layout
- `(app)/` — public + authenticated app, wrapped in `AppShell` (sidebar nav with role-conditional Admin link)
- `(admin)/admin/` — EDITOR+ only, wrapped in `AdminShell` (separate sidebar). The layout calls `requireRole("EDITOR")` so every nested route is gated at the layout level.

Public marketing landing at `src/app/page.tsx` uses its own `MarketingHeader` instead of `AppShell`.

### Auth + role gating

NextAuth v5 (beta) with the **Credentials provider** and **JWT sessions** (Credentials forces JWT; the Prisma adapter is *not* wired and the `Account`/`Session` tables exist only for future OAuth). Sessions are augmented with `role` via `src/types/next-auth.d.ts` and the `jwt` + `session` callbacks in `src/server/auth/config.ts`.

Two guard styles:
- **Pages / server actions** → `requireRole(min)` from `src/server/auth/guards.ts` (redirects to `/login` on 401, throws `Response(403)` on insufficient role).
- **Route handlers** → `requireApiRole(min)` from `src/server/auth/api-guards.ts` (returns a `NextResponse` you forward).

Role ranks: `GUEST 0 < USER 1 < EDITOR 2 < ADMIN 3`. The `/admin/users` page is `ADMIN` only and has a guard preventing the last admin from demoting themselves.

### Mutations: server actions vs API routes

The pattern is deliberate:
- **Server actions** (in `actions.ts` next to the page) for **admin form CRUD** — events, teams, players, users. They get path revalidation via `revalidatePath()` and need `requireRole`.
- **API routes** under `/api/admin/...` and `/api/ai/...` for **client-driven UI** that needs optimistic updates or polling — live entry tab, favorites toggle, AI regenerate button. They use `requireApiRole`.

Both routes share the same service-layer functions in `src/server/services/eventsService.ts`. Do not duplicate mutation logic; extend the service.

### Live match entry — the highlight feature

`/admin/matches/[id]/live` is the one-handed, big-tap-targets entry tab for use during a broadcast. Critical design choices:

- **Clock is computed client-side from `Match.kickoffStartedAt`** (and `secondHalfStartedAt`, `addedMinutes1H`). This avoids drift, survives tab reloads, and degrades to the right value if the page is opened mid-match. The same `computeClock` helper exists on both server (`src/server/services/eventsService.ts`) and a near-mirror in `src/components/admin/live/LiveMatchClock.tsx`.
- **Optimistic UI** — events appear in the timeline at a `temp_` ID, then get reconciled on the API response, then `router.refresh()` to re-sync server state.
- **Score auto-derives from `MatchEvent` rows** via `recomputeMatchScore`. Own-goals are credited to the *opposing* team. Never write `Match.homeScore` directly from event-entry code — go through the recompute.
- **Public match page polls every 15s while `status === LIVE`** via `LiveScorePoller` (calls `router.refresh()` only — no fetch endpoint needed). Stops as soon as status flips to FINISHED.

### AI summaries

`src/server/ai/aiSummaryService.ts::getSummary(subjectType, subjectId, { force? })` is the only entry point. It:

1. Builds a facts snapshot (`buildMatchFacts`, `buildTeamFacts`, `buildPlayerFacts`) — pure data, no narrative.
2. Computes `dataHash = sha256(canonicalJson(facts))`.
3. Checks `AiSummary` for `(subjectType, subjectId, dataHash)`. Hit → return cached.
4. Calls Claude Sonnet 4.6 with the static `STYLE_GUIDE` marked `cache_control: ephemeral` (Anthropic prompt cache, 5-min TTL).
5. Runs the **denylist regex** on output. If matched: one stricter retry → if it still matches, falls back to a deterministic template. The denylist is non-negotiable (see "Product non-negotiables").

Live matches **do not** auto-generate per event — the service early-returns a "Live — refreshes at HT and FT" placeholder. `recordHalfTime` and `fullTime` in eventsService call `scheduleMatchSummary(matchId)` (fire-and-forget) which forces a fresh generation at those two checkpoints only.

If `ANTHROPIC_API_KEY` is missing, the card degrades gracefully to "AI insights aren't configured" and persists a template summary — never a 500.

## Prisma 7 + Supabase gotchas

These bit us during setup; future agents will hit them too:

- **`url` and `directUrl` live in `prisma.config.ts`, NOT `schema.prisma`.** Prisma 7 removed those from the datasource block. The schema's `datasource db { provider = "postgresql" }` is intentionally minimal.
- **`PrismaClient` requires a driver adapter at runtime.** We use `@prisma/adapter-pg`. Instantiation is in `src/server/db.ts` and wrapped in a **`Proxy`** so the client is created lazily — `next build` collects page data for route handlers without `DATABASE_URL` set, and the Proxy defers connection until the first DB call.
- **Supabase Postgres** — use the **transaction pooler** (port 6543, `pgbouncer=true&connection_limit=1`) for `DATABASE_URL` and the **session pooler** (port 5432) for `DIRECT_URL`. The "Direct connection" tab in Supabase's Connect dialog is IPv6-only and won't work on most home networks. Never use raw `db.<project>.supabase.co`.
- **URL-special chars in DB passwords silently corrupt the connection.** Avoid `@`, `:`, `/`, `?`, `&`, `#`, `%` in the Supabase password — they need percent-encoding and tend to be missed.
- **`prisma.config.ts` loads `.env.local` with `override: true`** because the Prisma CLI only auto-reads `.env`. Keep that pattern.

## TypeScript & build quirks

- **`isolatedModules: true`** means you can't reference values from ambient `const enum`s (e.g. `@node-rs/argon2`'s `Algorithm.Argon2id`). Use plain numbers or omit the option (Argon2id is the default).
- **Top-level `await` in `scripts/*.ts` won't work with `tsx`** because they transpile as CJS. Wrap in an `async function main()` (see `scripts/make-admin.ts`).
- **Next 16 page/handler params are `Promise`-shaped**: `params: Promise<{ id: string }>` and you `await ctx.params`. This is consistent with App Router after Next 15.
- **`pnpm typecheck` can emit stale errors** from `.next/dev/types/validator.ts` when the dev server is running and you add a new route group. Run `pnpm build` to regenerate types; the dev server picks the new ones up on its next reload.

## Styling

Tailwind v4 with `@theme inline` in `src/app/globals.css` — palette tokens (`--color-background`, `--color-card`, `--color-primary`, `--color-accent`, etc.) come from there and are usable as `bg-background`, `text-primary`, etc. There is no `tailwind.config.ts`. The app is dark-mode only by design (`html { color-scheme: dark }`).

## Seed data

`prisma/seed-data/*.json` is the source of truth for content. Upserts are idempotent on natural keys: `Team.id` (ISO-3), `Player.id` (slug), `Venue.id` (slug), `Match.matchNumber` (unique). To add data, edit JSON + run `pnpm db:seed` rather than wiring up a one-off script.

Many of the seeded teams beyond the three hosts (MEX/CAN/USA) are plausible-but-speculative qualifiers — the admin CRUD UI (`/admin/teams`, `/admin/players`) is the correct way to fix up real qualifiers as they're confirmed.
