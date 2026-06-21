# JobFlow — Current Context (for AI)

> **Read this first.** This is the always-current snapshot of the project.
> It exists so any AI session (or future-you) can get productive in under a minute without re-reading every doc.
>
> **Cadence:** Updated at the end of every phase (and after any significant mid-phase change). See [Update Protocol](#update-protocol) at the bottom.
>
> **Last updated:** 2026-06-21 · Phase 4 complete (Hardening & Deploy 4.1–4.6 done); Post-MVP/Deferred remaining

---

## 1. What is JobFlow?

A personal, AI-assisted job application tracker. Add jobs manually, let AI extract structure from pasted descriptions, connect Gmail, and automatically detect job-related emails — updating status and surfacing action items in one unified dashboard.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · Prisma · PostgreSQL (Neon) · Auth.js (Google) · OpenRouter (Qwen 3 8B) · Vercel.

---

## 2. Current Status — At a Glance

| Phase | Name | Status | Details |
|---|---|:---:|---|
| 0 | Planning & Docs | ✅ | `PLAN.html`, `PROGRESS.md`, `CONTEXT/` complete |
| 1 | Foundation (auth + CRUD + dashboard) | ✅ | 1.1–1.11 complete: scaffold, tokens, Prisma, schema, migration, Auth.js, middleware, job CRUD (repo + actions + forms), dashboard with stat cards + activity, jobs table with search/filter, app shell (sidebar + topbar) |
| 2 | Gmail Integration | ✅ | 2.1–2.7 complete: OAuth scopes, AES-256-GCM encrypted token persistence, sync service fetching messages since `last_sync_at`, deduplication via unique constraint, sync dashboard, sync/disconnect/link actions |
| 3 | AI Email Classification | ✅ | 3.1–3.8 complete: OpenRouter client, structured output Zod schema, classify endpoint, fuzzy match job, auto status updates, auto-created tasks, Job Detail Timeline/Tasks/Emails page, tasks groups |
| 4 | Hardening & Deploy | ✅ | 4.1–4.6 complete: Vitest testing (57 tests passing), rate limiting utilities and route integration, root/dashboard error boundaries, scrollbars/selection styling, DEPLOYMENT.md, and vercel.json crons configuration. |

**MVP definition of done:** User logs in with Google → connects Gmail → adds jobs manually → dashboard updates automatically as job emails arrive, with status changes and action items surfaced.

**Key product decision:** MVP skips AI job-description parsing and focuses on **Gmail integration + email classification** (highest user value, fastest to usable). JD parsing is Phase 5 (deferred).

---

## 3. Where Everything Lives

```
jobflow/
├── AGENTS.md              # AI contract — read before building UI
├── PLAN.html              # Full design + architecture (open in browser)
├── PROGRESS.md            # Granular task tracker (update per task)
├── CURRENT_CONTEXT.md     # ← YOU ARE HERE. Always-current snapshot.
├── CONTEXT/               # design system specs
├── prisma/schema.prisma   # User, Job, Email, Task + enums
├── prisma.config.ts       # Prisma 7 CLI config (owns DATABASE_URL)
├── src/
│   ├── app/
│   │   ├── (auth)/signin/page.tsx         # "Continue with Google" page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                  # App shell (sidebar + topbar)
│   │   │   ├── page.tsx                    # Dashboard: stat cards, activity, action items
│   │   │   ├── loading.tsx                 # Dashboard skeleton
│   │   │   ├── not-found.tsx               # (dashboard) 404 boundary
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx                # /jobs table (server, searchParams-driven)
│   │   │   │   ├── loading.tsx             # /jobs skeleton
│   │   │   │   ├── new/page.tsx            # /jobs/new Add Job form
│   │   │   │   └── [id]/edit/page.tsx      # /jobs/:id/edit Edit Job form
│   │   │   ├── tasks/page.tsx              # /tasks stub (canonical empty state)
│   │   │   └── gmail/page.tsx              # /gmail stub (canonical empty state)
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── globals.css              # design tokens → @theme inline (dark-first)
│   │   └── layout.tsx               # Inter + JetBrains Mono via next/font
│   ├── components/
│   │   ├── card.tsx                # Universal container (CONTEXT/02 §2)
│   │   ├── empty-state.tsx         # Canonical empty/zero state (CONTEXT/02 §16)
│   │   ├── stat-card.tsx           # Dashboard metric tile (CONTEXT/02 §3)
│   │   ├── status-badge.tsx        # Single owner of status→color map (CONTEXT/02 §4)
│   │   ├── shell/
│   │   │   ├── app-shell.tsx       # Desktop dock + mobile drawer overlay
│   │   │   ├── nav.ts              # Nav items + page-title resolver
│   │   │   ├── sidebar.tsx         # 260px sidebar (CONTEXT/02 §7)
│   │   │   ├── topbar.tsx          # 56px topbar (CONTEXT/02 §8)
│   │   │   └── user-menu.tsx       # Avatar dropdown + sign out
│   │   ├── job/
│   │   │   ├── job-form.tsx        # Shared Add/Edit form (useActionState)
│   │   │   └── jobs-table.tsx      # Jobs table + search/filter + row … menu + delete dialog
│   │   └── ui/                     # shadcn primitives (table, dialog, dropdown-menu, select, …)
│   ├── lib/
│   │   ├── repositories/
│   │   │   ├── jobRepo.ts          # Job queries + mutations
│   │   │   └── taskRepo.ts         # Task read paths
│   │   ├── actions/
│   │   │   ├── types.ts            # ActionResult<T> + ok/fail helpers
│   │   │   ├── job.ts              # Job Server Actions (create/update/delete)
│   │   │   └── auth.ts             # Sign-out Server Action
│   │   ├── auth/
│   │   │   ├── auth.config.ts      # edge-safe config (for middleware)
│   │   │   └── index.ts            # full config: Google + DB callbacks
│   │   ├── db/index.ts             # Prisma client singleton (Neon adapter)
│   │   ├── format.ts               # Date/number formatting (CONTEXT/04 §7)
│   │   ├── schemas/job.ts          # Zod schemas (create + update)
│   │   └── utils.ts                # cn()
│   ├── middleware.ts                # auth guard (default export, Next 16)
│   └── types/next-auth.d.ts         # session.user.id augmentation
├── .env.example           # all required env vars (PLAN §16)
└── package.json           # npm; Next 16, React 19, Prisma 7, Tailwind v4
```

**Reading order for a fresh session:**
1. This file (snapshot + next actions).
2. [`PROGRESS.md`](./PROGRESS.md) (which exact tasks are pending/in-progress).
3. The relevant `CONTEXT/` spec for what you're about to build.
4. `PLAN.html` § only if you need deep architecture/schema detail.

---

## 4. Decisions to Respect (don't re-litigate)

These are settled. If you want to change one, flag it explicitly rather than silently deviating.

- **Single Next.js codebase** — no separate backend service. Route Handlers + Server Actions.
- **Dark-first UI**, indigo accent (`#6366f1`), mono for all data. Tokens defined in `CONTEXT/01-design-tokens.md`.
- **One `<StatusBadge />`** owns the status→color map. Never hand-color status.
- **PostgreSQL on Neon**, Prisma ORM, managed migrations.
- **Auth.js v5** (Google OAuth) storing Gmail tokens encrypted at rest.
- **Gmail sync = polling** on refresh + Vercel Cron. Push (Pub/Sub) is deferred to Phase 6.
- **AI = OpenRouter, Qwen 3 8B**, forced structured JSON output. Fails gracefully (raw store, manual queue).
- **Idempotency** via `gmail_message_id @unique`. Re-syncs never duplicate.
- **Zod validation** on every API boundary and Server Action.

### Deviations adopted in Phase 1 (documented, not silent)

- **Next.js 16 + Tailwind v4** (not 15 / v3 as the stack line implies) — `create-next-app@latest` moved on. Tailwind v4 uses CSS-first config (`@theme inline` in `globals.css`) instead of `tailwind.config.ts`; tokens are mapped there. Behavior matches the spec.
- **Prisma 7** — the datasource `url` no longer lives in `schema.prisma`; it's in `prisma.config.ts` (`datasource.url = env("DATABASE_URL")`). `prisma.config.ts` explicitly loads `.env.local` (dotenv's default is `.env`, which would skip Next.js's local file). Runtime uses the `@prisma/adapter-neon` driver adapter passed to `PrismaClient` (serverless-friendly for Vercel).
- **Auth.js v5 (next-auth@beta) with JWT strategy + manual User upsert** — NOT `@auth/prisma-adapter`. JobFlow's `User` model embeds OAuth tokens directly (no separate `Account`/`Session` tables, per PLAN §09), so the adapter's expected schema doesn't fit. The `signIn` callback upserts the User row; `jwt`/`session` callbacks attach the DB user id. Split config: `src/lib/auth/auth.config.ts` (edge-safe, for middleware) + `src/lib/auth/index.ts` (full, with Google provider + DB). Phase 2 extends the callbacks to store the Gmail refresh token.
- **Next 16 middleware = explicit default export.** The old `export const { auth: middleware } = NextAuth(...)` shorthand no longer works — Next 16 requires a real `middleware` function export. `src/middleware.ts` uses `export default auth`. (Next 16 also renames the convention to "proxy" but `middleware.ts` still works with a deprecation warning.)
- **Data layer = Server Actions + RSC** (not the REST `/api/*` handlers in PLAN §07). Job CRUD and dashboard will read via repositories in server components and mutate via `'use server'` actions. The PLAN §07 API contracts become internal repository/action boundaries. Chose for fewer moving parts + no extra client deps; revisit if a public API or webhooks are needed.
- **Package manager = npm** (not pnpm).

---

## 5. Next Actions

> What to do right now. Mirrors the first non-complete tasks in `PROGRESS.md`.

All MVP phases (Phase 1 to Phase 4) are completed. Next steps include reviewing deferred post-MVP features:
1. ⏭️ AI job parsing (paste JD → autofill) - Phase 5
2. ⏭️ Analytics dashboard (success rate, conversion) - Phase 5
3. ⏭️ Gmail Push via Google Pub/Sub - Phase 6
4. ⏭️ Company insights - Phase 5
5. ⏭️ PWA / mobile support - Phase 5

---

## 6. Environment & Prerequisites

- [x] Node 20+ / npm (Node 24, npm 11)
- [x] Neon dev database + `DATABASE_URL` in `.env.local`
- [x] Google OAuth credentials (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`) + `AUTH_SECRET` (auth flow wired; do a real sign-in to fully confirm)
- [x] OpenRouter API key (configured in `.env.local`)
- [x] `TOKEN_ENCRYPTION_KEY` (for Gmail refresh tokens — Phase 2, encrypted at rest)

`.env.example` is committed with all vars (PLAN §16). `.env.local` has DB, auth, and OpenRouter vars set.

---

## 7. Conventions for AI Sessions

- **Before building UI:** read [`AGENTS.md`](./AGENTS.md) + the relevant spec. Match tokens; don't hardcode hex/sizes.
- **After completing a task:** flip its symbol in `PROGRESS.md` (`⬜ → 🔄 → ✅`).
- **After completing a phase:** run the [Update Protocol](#update-protocol) below to refresh this file.
- **Token names, not literals:** `bg-bg-soft`, `text-accent`, `border-border` (after Tailwind mapping), never `#111113`.
- **One primary button per view.** Mono for IDs/dates/counts/enums.
- **Never leave a container without** empty/loading/error state (`CONTEXT/04`).

---

## Update Protocol

> Run this at the end of every phase (and optionally after major mid-phase milestones).

1. **`PROGRESS.md`** — mark every task in the completed phase ✅; set the next phase's first task 🔄 (in progress).
2. **This file** — update:
   - `Last updated` date + phase at the top.
   - **§2 Current Status** table (flip the phase).
   - **§5 Next Actions** (replace with the next phase's first ~5 tasks).
   - **§6 Environment** (check off anything now configured).
   - Add a one-line entry to **§8 Changelog** below.
3. **`CONTEXT/`** — only if a decision changed how something should look/behave; otherwise leave as-is.
4. Commit with message: `docs(context): update after Phase N`.

### §8 Changelog
> Newest first. One line per update.

- **2026-06-21** — Phase 4 complete (Hardening & Deploy): Integrated Vitest and wrote 57 tests covering repos, services, utilities, and routes; added client-IP and user sliding-window rate limiters; added root and dashboard error boundary elements; polished selection and scrollbar styling; created DEPLOYMENT.md and vercel.json cron jobs configuration. Next: Post-MVP / Deferred.
- **2026-06-21** — Phase 3 complete (AI Email Classification): OpenRouter Qwen 3 8B client & Zod schema JSON parser; classify endpoint; sync integration with fuzzy matching, auto status updates, and auto-generated tasks; Gmail API query pre-filtering (excluding promotions/social/forums) and server-side pagination (30 per page) with UI controls; rich Job Detail page with chronological Activity Timeline, checklist, CRM, notes, and matched emails; /tasks Action Items page with responsive calendar groups. Build + lint clean. Next: Phase 4 (Hardening & Deploy).
- **2026-06-21** — Phase 2 complete (Gmail integration): Configured Google OAuth `gmail.readonly` scope + offline access; AES-256-GCM encrypted refresh token storage at rest; Gmail service client fetching new messages since last sync with auto-token-refresh; coordinator syncing and deduplicating emails; /gmail dashboard page with sync metrics, sync triggers, and manual link to jobs dialog/actions. Clean build and lint. Next: Phase 3 (AI Email Classification).
- **2026-06-20** — Phase 1 complete (1.8–1.11): Full Job CRUD (repository + Zod 4 schemas + Server Actions), Add/Edit job form (`/jobs/new`, `/jobs/[id]/edit`), dashboard home with 5 stat cards + Recent Activity + Open Action Items + Needs Attention, jobs table with search/filter + ⋯ row menu + delete dialog, app shell (sidebar 260px + topbar 56px + avatar dropdown + mobile drawer), `/tasks` and `/gmail` stub pages, Sonner toasts, dashboard + jobs loading skeletons, `not-found.tsx` boundary. Build + lint clean. Next: Phase 2 (Gmail integration).
- **2026-06-20** — Phase 1 foundation (1.1–1.5) scaffolded: Next.js 16 + TS strict + Tailwind v4, shadcn/ui with full design-token system in `globals.css`, Prisma 7 + Neon adapter with schema (User/Job/Email/Task + JobStatus/TaskSource enums) and indexes. Schema validated + migration SQL preview verified; live migrate pending `.env.local`. Decisions: Server Actions + RSC for data layer; npm. Next: Auth.js + Google OAuth (1.6).
- **2026-06-20** — Phase 0 complete. Planning docs + design system (`PLAN.html`, `PROGRESS.md`, `CONTEXT/`) created. `CURRENT_CONTEXT.md` established as the AI entry point. Build not yet started.
