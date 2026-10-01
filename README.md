# Olympic — a long-term movement journal

[![CI](https://github.com/EvanWAppel/olympic/actions/workflows/ci.yml/badge.svg)](https://github.com/EvanWAppel/olympic/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-215%20passing-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

**Live:** [olympic.evanappel.me](https://olympic.evanappel.me) · **Case study:** [/about](https://olympic.evanappel.me/about)

Olympic reconciles two disconnected sources of walking data — treadmill sessions I log by
hand (speed / incline / duration) and passive Apple Health data (steps, distance, calories,
outdoor walks) — into one long-term dashboard: daily, weekly, monthly, and a year-long
heatmap. It's a real tool I use to log a workout in under ten seconds one-handed at the gym,
engineered deliberately as a portfolio piece.

It runs as a single deployment with two faces:

- **Public, read-only:** anyone with the link sees the live, real-data dashboard and the
  `/about` engineering case study — no login, no empty states, no access wall.
- **Private, owner-only:** logging, settings, Apple Health import/export, and the ingest
  secret sit behind a WebAuthn passkey (Face ID) and a signed session cookie.

## What's interesting in here

- **Read-time deduplication.** The phone already counts treadmill steps, so displayed totals
  subtract each treadmill workout's own steps/distance/calories from the phone's same-day
  total and add the treadmill figures back — computed fresh on every read, so re-importing
  Apple Health is always safe (no drift, one rule).
- **Passkeys, single-user.** No passwords, no `user_id` columns, no sign-up. One human,
  several devices; a `jose`-signed httpOnly cookie carries the session, credentials live in
  Postgres, and registration is gated by a one-time bootstrap secret.
- **Public/private split by route guard, not deployment protection.** A single
  `requireOwner()` wraps every mutation and secret-bearing route; public reads go through
  field-whitelist DTOs so no credential is ever serialized to an anonymous visitor.
- **Idempotent machine-to-machine ingest.** A nightly push from the Health Auto Export iOS
  app upserts on `external_id`, so replays are safe.
- **PWA with an offline save queue** — logging works even on flaky gym Wi-Fi.

## Stack

| | |
|---|---|
| Framework | Next.js 16 App Router (TypeScript) |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts + react-activity-calendar |
| Database | Neon Postgres (Vercel Marketplace) |
| ORM | Drizzle |
| Auth | WebAuthn passkeys + `jose`-signed session cookie |
| Hosting | Vercel (Fluid Compute, Node.js) |

## How it was built

Built with [Claude Code](https://claude.com/claude-code) following a
**Requirements → Orchestrate → Check → Review → Loop → Ledger** workflow: an interviewed
[`PRD.md`](./PRD.md) drives a grouped [`TASKS.md`](./TASKS.md); work is test-first (215 tests
across unit, DB-integration, and API-route layers); every decision with a real trade-off is
recorded in [`DECISIONS.md`](./DECISIONS.md); and anything only a human can unblock lands in
[`BLOCKED.md`](./BLOCKED.md).

## Running locally

Requires Node 24+, pnpm, and a Postgres database (Neon or local).

```bash
pnpm install

# Configure env (see .env.local): DATABASE_URL, SESSION_SECRET,
# BOOTSTRAP_REGISTRATION_SECRET, RP_ID, RP_ORIGIN, health_ingest_secret.
pnpm db:migrate        # apply Drizzle migrations
pnpm dev               # http://localhost:3000
```

## Tests

The unit tests run anywhere. The DB-integration tests (repositories + API routes) talk to
Postgres through the Neon HTTP driver, so they run against a throwaway Postgres + Neon HTTP
proxy defined in [`docker-compose.test.yml`](./docker-compose.test.yml) — the same stack CI
uses, no remote branch required:

```bash
docker compose -f docker-compose.test.yml up -d --wait
docker compose -f docker-compose.test.yml exec -T postgres \
  psql -U postgres -d main -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto'
for f in drizzle/*.sql; do
  docker compose -f docker-compose.test.yml exec -T postgres \
    psql -U postgres -d main -v ON_ERROR_STOP=1 < "$f"
done

DATABASE_URL='postgres://postgres:postgres@localhost:5432/main' \
NEON_LOCAL_PROXY_URL='http://localhost:4444/sql' \
  pnpm test:run

docker compose -f docker-compose.test.yml down -v
```

Every push and pull request runs `typecheck · lint · test` (full suite) via
[GitHub Actions](./.github/workflows/ci.yml).

<!-- TODO: add docs/dashboard.png (a screenshot/GIF of the live dashboard) and embed it here. -->
