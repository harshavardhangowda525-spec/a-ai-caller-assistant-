# Infinity AI Caller

A production-ready, **compliance-first** AI voice outbound calling platform for
**Infinity Web & Apps**. Upload business leads, validate & de-duplicate Indian
phone numbers, and let an AI voice agent call eligible leads **sequentially,
one at a time**, through a compliant business telephony provider — with a
consent-gated human transfer to the owner.

> ⚠️ **Compliance responsibility.** The owner/operator is responsible for
> ensuring every contact is legally eligible for commercial calling and that the
> telephony configuration complies with applicable Indian telecom requirements
> (TRAI / UCC / DND). This application **does not** spoof caller ID or bypass
> spam/UCC controls — those behaviours are intentionally not implemented.

---

## Table of contents

1. [Architecture](#architecture)
2. [Tech stack](#tech-stack)
3. [Quick start (local, mock mode)](#quick-start-local-mock-mode)
4. [Environment variables](#environment-variables)
5. [Database setup](#database-setup)
6. [Creating the first admin user](#creating-the-first-admin-user)
7. [Running the calling engine](#running-the-calling-engine)
8. [Connecting a real telephony provider](#connecting-a-real-telephony-provider)
9. [Connecting a real AI provider](#connecting-a-real-ai-provider)
10. [Caller ID & the no-spoofing rule](#caller-id--the-no-spoofing-rule)
11. [Human transfer workflow](#human-transfer-workflow)
12. [Webhooks](#webhooks)
13. [Testing](#testing)
14. [Deployment](#deployment)
15. [Project structure](#project-structure)
16. [Compliance & safety design](#compliance--safety-design)

---

## Architecture

The codebase is deliberately layered so each concern is isolated and testable:

```
frontend (Next.js App Router, Tailwind)
   │
backend (route handlers) ── authentication (Supabase Auth + middleware)
   │
services (callService, queries, apiAuth)
   │
┌──────────────┬───────────────┬───────────────┬──────────────┐
queue engine   telephony        AI              domain
(sequential,   (provider IF +   (provider IF +  (pure rules:
 restart-safe) mock/twilio/     mock/anthropic) eligibility,
               exotel)                          call-state,
   │                                            phone, csv)
database (PostgreSQL / Supabase + RLS + atomic claim function)
```

The **domain** layer (`src/domain`, `src/lib/phone.ts`, `src/lib/csv.ts`) is
framework-free and fully unit-tested. The **queue engine** depends only on a
`QueueRepository` interface, so it runs against both an in-memory store (tests)
and Postgres (production) with identical guarantees.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Supabase** (PostgreSQL, Auth, Row Level Security)
- **Tailwind CSS** for the premium dashboard
- **Zod** validation, **Papa Parse** CSV, **Recharts** charts
- **Vitest** tests
- Telephony provider abstraction: **mock** (dev), **Exotel** & **Twilio** adapters

## Quick start (local, mock mode)

You can run the entire UI and pipeline **without any real provider** using the
built-in mock telephony + AI providers.

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# (mock mode works with TELEPHONY_PROVIDER=mock and AI_PROVIDER=mock)
# To exercise the dashboard with data, also set the Supabase variables below.

# 3. Run tests (no DB required)
npm test

# 4. Start the app
npm run dev
# → http://localhost:3000
```

Without Supabase configured, the app renders a **Setup screen** telling you
exactly which environment variables to add. This is intentional — the app never
pretends calling works before it is actually connected.

## Environment variables

See [`.env.example`](./.env.example) for the full list. Key ones:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database + auth. Service role is **server-only**. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser auth (RLS enforced). |
| `TELEPHONY_PROVIDER` | `mock` \| `twilio` \| `exotel` |
| `TELEPHONY_API_KEY`, `TELEPHONY_API_SECRET`, `TELEPHONY_ACCOUNT_SID`, `TELEPHONY_SUBDOMAIN` | Provider credentials (server-only). |
| `TELEPHONY_WEBHOOK_SECRET` | Verifies inbound webhook signatures. |
| `OUTBOUND_CALLER_ID` | Verified business caller ID. **Never** exposed to the browser. Default `6360471652`. |
| `OWNER_TRANSFER_NUMBER` | Owner/sales number for transfers. **Never** exposed to the browser. Default `6360471652`. |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` | Conversational AI. |
| `INTERNAL_WORKER_SECRET` | Bearer token protecting the cron tick endpoint. |

**`OUTBOUND_CALLER_ID` and `OWNER_TRANSFER_NUMBER` are read only on the server.**
They never appear in any client bundle, log, or analytics payload.

## Database setup

Migrations live in [`supabase/migrations`](./supabase/migrations) and run in
filename order:

- `0001_init.sql` — tables, enums, triggers, default settings
- `0002_claim_function.sql` — the atomic `claim_next_lead()` function
- `0003_rls.sql` — Row Level Security policies

Apply them either way:

```bash
# Option A — Supabase CLI
supabase db push

# Option B — psql (uses DATABASE_URL)
npm run db:migrate
npm run db:seed        # optional demo data

# Option C — paste each file into the Supabase SQL editor, in order
```

## Creating the first admin user

Auth is handled by Supabase (passwords are hashed by Supabase Auth — never
stored in plaintext).

1. In the Supabase dashboard → **Authentication → Users → Add user**, create an
   email + password.
2. Insert a matching row into `public.users` so RLS grants access:

```sql
insert into public.users (id, email, role)
values ('<auth-user-uuid>', 'admin@infinitywebapps.com', 'admin');
```

3. Sign in at `/login`. Password reset is available on the same screen.

## Running the calling engine

The sequential engine is **tick-based** and restart-safe. Choose one:

```bash
# Long-lived worker process (recommended for a VM/container)
npm run worker
```

or drive it from a scheduler (serverless-friendly) by POSTing to the protected
tick endpoint every few seconds:

```bash
curl -X POST https://your-app/api/cron/tick \
  -H "Authorization: Bearer $INTERNAL_WORKER_SECRET"
```

On startup the worker runs **recovery**: any call orphaned by an unclean
shutdown is closed and its lead reset, so a restart never double-dials.

## Connecting a real telephony provider

Provider credentials stay **server-side**. Two adapters are included behind the
`TelephonyProvider` interface (`src/telephony`):

- **Exotel** (recommended for Indian domestic calling) — set
  `TELEPHONY_PROVIDER=exotel`, plus `TELEPHONY_ACCOUNT_SID`,
  `TELEPHONY_SUBDOMAIN`, `TELEPHONY_API_KEY`, `TELEPHONY_API_SECRET`.
- **Twilio** — set `TELEPHONY_PROVIDER=twilio`, `TELEPHONY_API_KEY` (Account
  SID), `TELEPHONY_API_SECRET` (Auth Token).

To add another vendor, implement the `TelephonyProvider` interface and register
it in `src/telephony/index.ts`.

> Calling is blocked until the provider confirms your caller ID is
> registered/verified. See below.

## Connecting a real AI provider

Set `AI_PROVIDER=anthropic` and `AI_API_KEY`. The system prompt is assembled
from the **owner-editable approved information** (AI Script page) plus
**immutable safety rails** that cannot be edited away. Swap in any model by
implementing the `AiProvider` interface (`src/ai`).

## Caller ID & the no-spoofing rule

`OUTBOUND_CALLER_ID` is validated in two stages:

1. **Config** — must be a well-formed Indian number.
2. **Provider** — `validateCallerId()` confirms the number is
   registered/verified on your account.

If the provider reports the number is **not** verified, the app **refuses to
dial** and shows a clear configuration error (Settings page + campaign start).
It never falls back to spoofing.

## Human transfer workflow

When a caller explicitly agrees to speak with the owner:

1. The AI flow (or a supervisor on the Live Calls page) calls
   `POST /api/calls/:id/transfer` with `callerAgreed: true`.
2. The transfer coordinator (`src/telephony/transfer.ts`) enforces **two hard
   rules**: explicit consent, and a provider-verified caller ID (no spoofing).
3. The provider bridges the call to `OWNER_TRANSFER_NUMBER`. The owner receives
   a **normal incoming call** on their ordinary phone — the app never tries to
   control the owner's device.
4. The dashboard reflects: *Transfer requested → Transferring → Transfer
   successful / failed → Call ended*.

## Webhooks

`POST /api/webhooks/telephony` ingests provider events. It:

- **verifies the signature** (`handleWebhook()` per provider),
- **normalizes** the payload to a common shape,
- is **idempotent** — a unique `(call_id, provider_event_id)` index drops
  duplicates,
- validates every transition against the **call state machine**, so
  out-of-order/duplicate events can never corrupt state.

Events handled: initiated, ringing, answered, AI started/ended, transfer
started/completed/failed, call ended.

## Testing

```bash
npm test        # 39 unit tests
npm run test:watch
```

Coverage includes the required areas: **queue processing**, **duplicate
prevention**, **suppression list**, **call state transitions**, **transfer
logic**, and **CSV validation**, plus phone normalization and eligibility rules.

## Deployment

- **Frontend + API:** deploy to Vercel (or any Node host). Set all env vars in
  the platform's secret manager.
- **Database:** Supabase (managed Postgres). Run the migrations.
- **Worker:** either run `npm run worker` on a small always-on instance
  (Railway, Fly.io, a container), **or** schedule `POST /api/cron/tick` with a
  cron (Vercel Cron / GitHub Actions / Supabase `pg_cron`) using the
  `INTERNAL_WORKER_SECRET` bearer token.
- Point your telephony provider's status webhook at
  `https://<your-app>/api/webhooks/telephony`.

**Do not enable live calling** until: provider credentials are set, the caller
ID is verified with the provider, and you have confirmed your Indian telephony
configuration is compliant.

## Project structure

```
src/
  domain/        pure rules: types, eligibility, call-state machine
  lib/           phone, csv, config, logger, supabase clients
  telephony/     provider interface + mock/twilio/exotel + transfer coordinator
  ai/            provider interface + mock/anthropic + approved script
  queue/         engine, repository interface, memory + supabase repos, worker
  server/        callService, queries, apiAuth, supabase repository
  components/     reusable UI (sidebar, topnav, charts, badges, toasts, modal…)
  app/           Next.js routes (login, dashboard, leads, upload, campaigns,
                 live, history, callbacks, suppression, ai-script, settings) + api
supabase/        migrations + seed
tests/           vitest suites
scripts/         migrate + seed helpers
```

## Compliance & safety design

Compliance is part of the architecture, not an afterthought:

- **Eligibility gate** (`src/domain/eligibility.ts`) blocks Do-Not-Call,
  suppressed, no-consent, invalid, over-attempt, and callback-not-due leads —
  enforced both in the app and in the SQL claim function.
- **Permanent suppression list** with a DB trigger that forces matching leads to
  `do_not_call`.
- **Sequential-only** calling with DB row-locking (`FOR UPDATE SKIP LOCKED`) so a
  lead is never dialled twice.
- **No caller-ID spoofing** — dialling is blocked unless the provider verifies
  the number.
- **AI safety rails** — the agent must identify as automated, never impersonate a
  human, never invent prices/claims, stop on refusal, and honour do-not-call.
- **Mandatory admin confirmation** before starting a campaign, plus an
  always-visible compliance banner.
- **Secrets** (`OWNER_TRANSFER_NUMBER`, `OUTBOUND_CALLER_ID`, provider keys) are
  server-only and redacted from logs.

---

_Built for Infinity Web & Apps._
