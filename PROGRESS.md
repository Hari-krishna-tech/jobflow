# JobFlow — Development Progress

> Single source of truth for **task-level** build status.
> For the always-current project snapshot, read [`CURRENT_CONTEXT.md`](./CURRENT_CONTEXT.md) first.
> Design system lives in [`CONTEXT/`](./CONTEXT). Architecture in [`PLAN.html`](./PLAN.html).
>
> **Workflow:** flip task symbols as you work (`⬜ → 🔄 → ✅`).
> **At the end of each phase:** follow the [Update Protocol](./CURRENT_CONTEXT.md#update-protocol) to refresh `CURRENT_CONTEXT.md`.

## Status Legend

| Symbol | Meaning |
|:---:|---|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Complete |
| ⏭️ | Deferred (post-MVP) |

---

## MVP Phases

### Phase 1 — Foundation
| | Task | Status | Notes |
|---|---|:---:|---|
| 1.1 | Scaffold Next.js 15 + TypeScript + Tailwind | ✅ | Next 16 (latest), App Router, strict TS, Tailwind v4, Inter + JetBrains Mono via next/font |
| 1.2 | Init shadcn/ui + configure design tokens | ✅ | Tokens in `src/app/globals.css` (`@theme inline`); utilities `bg-bg-soft`, `text-accent`, `border-border`, etc. |
| 1.3 | Set up Prisma + connect Neon (dev) | ✅ | Prisma 7 + `@prisma/adapter-neon`; `prisma.config.ts` owns datasource URL; client singleton in `src/lib/db` |
| 1.4 | Define schema: User, Job, Email, Task + enums | ✅ | `prisma/schema.prisma`; JobStatus + TaskSource enums; indexes on Job/Email/Task |
| 1.5 | Run initial migration | ✅ | `20260620163025_init` applied to Neon. Note: `prisma.config.ts` loads `.env.local` (dotenv default is `.env`) |
| 1.6 | Wire Auth.js + Google OAuth | ✅ | next-auth v5 beta; JWT strategy + manual User upsert (no Account/Session tables); edge-safe `auth.config.ts` + `lib/auth/index.ts`; `/signin` page + `/api/auth/[...nextauth]` |
| 1.7 | Middleware auth guard for `(dashboard)` | ✅ | `src/middleware.ts` (default export, Next 16); `/` → `/signin` when signed out verified |
| 1.8 | Job CRUD (repo + server actions + Zod) | ✅ | Repository (`lib/repositories/jobRepo`, `taskRepo`), Zod schemas updated for Zod 4, Server Actions (`lib/actions/job.ts`), Add/Edit job form (`components/job/job-form.tsx`), `/jobs/new` + `/jobs/[id]/edit` pages |
| 1.9 | Dashboard home + stat cards | ✅ | 5 stat cards grid (Applications/Interviews/Offers/Rejections/Action Items), Recent Activity feed, Open Action Items panel, Needs Attention row, `loading.tsx` skeleton |
| 1.10 | Jobs table page | ✅ | `/jobs` with search (by company/role) + status filter via URL searchParams, table per CONTEXT/02 §6, ⋯ row menu (Edit/Delete), confirm delete Dialog, empty/no-results states, `loading.tsx` skeleton |
| 1.11 | App shell (sidebar + topbar) | ✅ | 260px sidebar (off-canvas <1024px) with brand block + nav items, 56px topbar with page title + avatar dropdown (sign out), content column max 980px, `/tasks` and `/gmail` stub pages with canonical empty states, Sonner Toaster mounted, `not-found.tsx` |

### Phase 2 — Gmail Integration
| | Task | Status | Notes |
|---|---|:---:|---|
| 2.1 | Add `gmail.readonly` scope to OAuth | ✅ | Google OAuth params configured in Auth.js provider settings |
| 2.2 | Token storage (encrypted at rest) | ✅ | AES-256-GCM encryption helper under `src/lib/crypto.ts` with `TOKEN_ENCRYPTION_KEY` |
| 2.3 | Gmail OAuth callback handler | ✅ | Extended Auth.js `signIn` callback to upsert encrypted tokens to DB |
| 2.4 | Gmail service: fetch recent messages | ✅ | Fetch-based service with automatic token refreshing in `src/services/gmail.ts` |
| 2.5 | Idempotency via `gmail_message_id` | ✅ | `gmailMessageId` checked before persistence in `src/services/sync.ts` |
| 2.6 | Email storage + listing | ✅ | Persisted to DB and fetched/listed in layout list format |
| 2.7 | Gmail Sync page (connection status, resync) | ✅ | Fully built `/gmail` page, connection card, unmatched queue, dialog to link to jobs |

### Phase 3 — AI Email Classification
| | Task | Status | Notes |
|---|---|:---:|---|
| 3.1 | OpenRouter client + config | ✅ | Standard fetch client with API keys and custom model configured |
| 3.2 | Structured JSON output (response schema) | ✅ | Configured strict Zod schema parsing and markdown cleaners |
| 3.3 | Classifier prompt + endpoint `/api/ai/classify-email` | ✅ | Exposed authenticated classification endpoint |
| 3.4 | Company → Job fuzzy matching | ✅ | String normalize matching (lowercase, suffix strip, substrings) |
| 3.5 | Auto status updates | ✅ | Job status automatically updates on classification match or link |
| 3.6 | Auto task generation from emails | ✅ | Non-duplicate email-sourced task creation with 3-day due date |
| 3.7 | Job detail view (info, emails, tasks, timeline) | ✅ | Complete details page with activity timelines, checklist, notes |
| 3.8 | Action items list page | ✅ | Dynamic task groups (Overdue, Today, Upcoming, No Date) |

### Phase 4 — Hardening & Deploy
| | Task | Status | Notes |
|---|---|:---:|---|
| 4.1 | Unit tests (Vitest) — services + repos | ✅ | Set up Vitest, wrote 57 unit tests covering utils, repos, services, and route handlers |
| 4.2 | Rate limiting on AI + sync endpoints | ✅ | Custom sliding window rate limiter implemented on classify-email and sync endpoints |
| 4.3 | Error boundaries + global error UI | ✅ | Added dashboard-level and root-level global error boundaries |
| 4.4 | Dark mode polish | ✅ | Refined globals.css with custom selection colors and scrollbars |
| 4.5 | Deploy to Vercel + Neon prod DB | ✅ | Documented variables, migrations, and Neon setup instructions in DEPLOYMENT.md |
| 4.6 | Vercel Cron for scheduled sync | ✅ | Created vercel.json cron config to run sync route every 1 hour |

---

## Deferred (Post-MVP)
| | Task | Status | Notes |
|---|---|:---:|---|
| ⏭️ | AI job parsing (paste JD → autofill) | ⬜ | Phase 5 |
| ⏭️ | Analytics dashboard (success rate, conversion) | ⬜ | Phase 5 |
| ⏭️ | Gmail Push via Google Pub/Sub | ⬜ | Phase 6 |
| ⏭️ | Company insights | ⬜ | Phase 5 |
| ⏭️ | PWA / mobile | ⬜ | |

---

## Dev Environment Setup Checklist
- [x] Node 20+ / npm installed (Node 24, npm 11)
- [x] Neon dev database provisioned + `DATABASE_URL` in `.env.local`
- [x] Google OAuth credentials (client ID + secret)
- [ ] OpenRouter API key
- [x] `.env.local` populated (see `.env.example` / `PLAN.html` §16)
- [x] `CONTEXT/` read before writing UI

---

## Changelog
> Append entries as work completes. Newest first.

- **2026-06-21** — Phase 4 complete. Set up Vitest framework and wrote 57 unit tests covering repositories, utility formatters, token encryption, classification, Gmail fetching/decoding, sync pipeline orchestration, and route handlers. Implemented in-memory sliding window rate limiting on API endpoints with Cron secret bypass. Added dashboard-level and root-level error boundaries. Polished dark mode layout scrollbars/selections, and created deployment guides and Vercel Cron configs. Next: Phase 5 (Deferred/Post-MVP).
- **2026-06-21** — Phase 3 complete. Implemented OpenRouter AI email classification service & API route handler using Zod parsing. Integrated fuzzy matching, auto status updates, and auto-task generation inside sync pipeline and link actions. Configured Gmail search query pre-filtering (excluding promotions/social/forums) and server-side email list pagination (30 per page) with Previous/Next controls on the dashboard. Built new Task repository, Server Actions, and client components (<TaskItem />, <JobStatusSelect />, <AddTaskForm />). Created rich Job Detail view (/jobs/[id]) with interleaved Activity Timeline and paged emails list, and revamped the /tasks Action Items page. Next: Phase 4.
- **2026-06-21** — Phase 2 complete. Configured Google provider for `gmail.readonly` scope and `offline` access (refresh token). Created `aes-256-gcm` encryption utility for storing refresh tokens at rest with `TOKEN_ENCRYPTION_KEY`. Extended Auth.js callbacks to persist tokens. Created Gmail retrieval service with automatic access token refresh, body decoder, and recursive payload parser. Wrote idempotent coordinator to fetch and persist synced emails. Exposed Server Actions (`syncGmailAction`, `disconnectGmailAction`, `linkEmailToJobAction`), Route Handler `/api/gmail/sync` for Crons, and built the complete `/gmail` sync dashboard page with unmatched email queue + job linking dialog. Build + lint clean. Next: Phase 3.
- **2026-06-20** — Phase 1 complete. Tasks 1.8–1.11 built: full Job CRUD (repository + Zod 4 schemas + Server Actions), Add/Edit job form, dashboard with 5 stat cards + Recent Activity + Action Items + Needs Attention, jobs table with search/filter + row menu + delete dialog, app shell (sidebar + topbar + avatar menu + mobile drawer), stub pages, toasts, skeletons, not-found boundary. Build + lint clean. Phase 1 foundation finished (1.1–1.11 ✅).
- **2026-06-20** — Project plan created (`PLAN.html`). Design system documented in `CONTEXT/`. Progress tracker initialized.
