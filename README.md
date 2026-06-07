# RealGoal

An independent, AI-powered analytics web platform for the 2026 FIFA World Cup.
Browse the schedule, drill into every team and player, watch matches go live
with one-tap event entry, and read plain-English summaries grounded in the
actual data.

> RealGoal is **not** a betting product. There are no odds, prediction markets,
> or wagering features anywhere in the app. It is also **not** affiliated with,
> endorsed by, or sponsored by FIFA.

---

## Tech stack

- **Next.js 16** (App Router, Server Actions, RSC) + **TypeScript strict**
- **Tailwind CSS v4** + custom dark palette
- **Prisma 7** + **Supabase Postgres** (transaction pooler at runtime, session pooler for migrations)
- **NextAuth v5** (Credentials provider, JWT sessions, argon2id passwords)
- **Recharts** for dashboards
- **Anthropic Claude** (`@anthropic-ai/sdk`) with prompt caching for match/team/player summaries
- Deploys to **Vercel**

## Project layout

```
src/
  app/
    (auth)/       login, signup
    (app)/        dashboard, matches, teams, players, standings, bracket, profile
    (admin)/      teams/players/users/matches CRUD + live entry tab
    api/          REST endpoints (favorites, AI, admin mutations)
  components/
    layout/       AppShell, AdminShell, Footer, MarketingHeader
    charts/       KpiCard, Recharts wrappers
    match/        timeline / stats / lineups / live poller
    admin/        forms + the live entry panel (admin/live/)
    ai/           summary card + regenerate button
    favorites/    star/save toggle
  server/
    db.ts         lazy PrismaClient (works at build time without DATABASE_URL)
    auth/         NextAuth config + role guards
    services/     match / team / player / stats / favorites / events
    ai/           anthropic client + style guide + summary service
  lib/
    validations/  zod schemas
    formatters.ts, utils.ts
prisma/
  schema.prisma   single source of truth
  seed.ts         idempotent upsert seeder
  seed-data/      venues / teams / players / matches JSON
scripts/
  make-admin.ts   promote a user to ADMIN by email
```

## Getting started

### 1. Install

```bash
pnpm install
```

### 2. Provision Supabase

Create a project at [supabase.com](https://supabase.com/dashboard). Click **Connect**
in the dashboard and grab two connection strings:

| Env var | Mode | Port |
|---|---|---|
| `DATABASE_URL` | **Transaction pooler** | 6543 |
| `DIRECT_URL` | **Session pooler** | 5432 |

Use the session pooler (not the direct IPv6 connection) for `DIRECT_URL` if you're on an IPv4 network.

### 3. `.env.local`

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL="postgresql://postgres.PROJECT:PWD@aws-X-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT:PWD@aws-X-REGION.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."   # optional; AI gracefully degrades without it
```

Avoid `@`, `:`, `/`, `?`, `&`, `#`, `%` in the database password — they need URL encoding and silently corrupt the connection string.

### 4. Migrate + seed

```bash
pnpm prisma migrate dev --name init
pnpm db:seed
```

### 5. Run

```bash
pnpm dev          # http://localhost:3000
```

### 6. Promote yourself to ADMIN

Sign up at `/signup`, then:

```bash
pnpm tsx scripts/make-admin.ts you@example.com
```

Refresh — the teal **Admin** link appears in the sidebar.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:migrate:deploy` | `prisma migrate deploy` (CI) |
| `pnpm db:seed` | Idempotent seed of venues, teams, USA squad, fixtures |
| `pnpm db:studio` | Prisma Studio (table viewer) |
| `pnpm tsx scripts/make-admin.ts <email>` | Promote a user to ADMIN |

## Live match entry

Sign in as EDITOR or ADMIN, open `/admin/matches` → pick a match → **🔴 Live entry mode**.

- **▶ Start match** flips status to `LIVE` and starts a server-recorded clock
- Big tap targets for each team: ⚽ Goal · 🟨 Yellow · 🟥 Red · 🔁 Sub
- Each button opens a small dialog with the team's squad (jersey-number search)
- **↶ Undo last** removes the most recent event with one tap
- **⏸ Half time** · **▶ Resume 2H** · **⏹ Full time** drive the lifecycle
- Score auto-derives from goal events (own-goals correctly credited)
- The public match page polls every 15s while status=LIVE and stops as soon as it flips to FINISHED

## AI insights

When `ANTHROPIC_API_KEY` is set, summaries are generated for matches (4th tab), teams, and players. The pipeline:

1. **Facts snapshot** built from Prisma queries, canonical-JSON serialized, SHA-256 hashed
2. **Cache check** — `(subjectType, subjectId, dataHash)` lookup. Hits return instantly with no Anthropic call.
3. **Generation** — Sonnet 4.6 with a static style guide marked `cache_control: ephemeral` (Anthropic prompt cache, 5-min TTL)
4. **Server-side denylist** — output is regex-checked for betting language. One stricter retry; if it still trips, falls back to a deterministic template.

Live matches do **not** auto-generate per event. Summaries refresh on half-time and full-time only.

## Deployment

Targeting Vercel + Supabase. Day-1 checklist:

- [ ] `pnpm db:migrate:deploy` against prod
- [ ] Admin user seeded
- [ ] All env vars set in Vercel project settings
- [ ] Lighthouse desktop ≥ 90 on `/`, `/dashboard`, `/matches`
- [ ] CSP not blocking any first-party asset
- [ ] Footer disclaimer visible on every page

## License

Private — not licensed for public use yet.
