# Olympic — Build Tasks

Implementation tasks for [PRD.md](./PRD.md). All work is **TDD**: write the test first, watch it fail, then implement until it passes. Each numbered ID is a small unit of work (~15–60 min). Check off `[ ]` → `[x]` as you complete.

## Reading guide

- **Phase 0** is sequential and blocking. Do it first, in order. It delivers a deployed end-to-end vertical slice: log a treadmill workout → see it on a chart, in prod.
- **Phases 1+** are organized into parallel **groups** (A, B, C, …). Each group is a workstream that an agent can claim independently. Within a group, tasks are sequential. Dependencies between groups are noted at the top of each group.
- **TDD pairing**: a `*.test` task always precedes its implementation task. Don't merge them.

---

## Phase 0 — Vertical slice (SEQUENTIAL, ship to prod first)

**Goal:** working deployed app that accepts a treadmill workout entry and shows today's steps on a bar chart. No calculations beyond `distance = speed × hours`. No Apple Health. No styling polish. Pure stack proof.

- [x] **P0.1** Run `pnpm create next-app olympic-app --typescript --tailwind --app --eslint --src-dir --no-import-alias` in this dir (or in-place if config allows); commit initial scaffold
- [x] **P0.2** Initialize git repo, push to GitHub (private)
- [x] **P0.3** Install and init shadcn/ui (`pnpm dlx shadcn@latest init`); add components: `button`, `input`, `label`, `card`, `form`, `sonner`
- [x] **P0.4** Install Vitest + React Testing Library + jsdom + `@testing-library/jest-dom`; add `test` script; create `vitest.config.ts` and `vitest.setup.ts`
- [x] **P0.5** Write smoke test `src/lib/__tests__/smoke.test.ts` asserting `1 + 1 === 2`; run `pnpm test` and verify it passes
- [x] **P0.6** Provision Neon Postgres via Vercel Marketplace; link project (`vercel link`, `vercel env pull .env.local`)
- [x] **P0.7** Install Drizzle ORM + `drizzle-kit` + `@neondatabase/serverless`; configure `drizzle.config.ts` pointing at `DATABASE_URL`
- [x] **P0.8** Define minimal `workout` table in `src/db/schema.ts` — columns: `id`, `start_at`, `end_at`, `minutes`, `speed_mph`, `incline_pct`, `distance_mi`, `created_at`. Generate + apply migration
- [x] **P0.9** Write test `src/db/__tests__/workouts.repo.test.ts` for `createWorkout()` and `listWorkouts()` (use a test database URL or transactional rollback)
- [x] **P0.10** Implement `src/db/workouts.repo.ts` with `createWorkout()` and `listWorkouts()`; tests pass
- [x] **P0.11** Write test `src/app/api/workouts/__tests__/route.test.ts` for `POST /api/workouts` (accepts speed/incline/minutes, returns saved row)
- [x] **P0.12** Implement `src/app/api/workouts/route.ts` (POST handler); tests pass
- [x] **P0.13** Write test `src/components/__tests__/treadmill-entry-form.test.tsx` — renders fields, submits, calls handler with parsed values
- [x] **P0.14** Implement `src/components/treadmill-entry-form.tsx` (shadcn Form, three inputs, Save button); tests pass
- [x] **P0.15** Write test `src/lib/__tests__/aggregate-daily.test.ts` for `aggregateDailyMiles(workouts)` (groups by date, sums miles)
- [x] **P0.16** Implement `src/lib/aggregate-daily.ts`; tests pass
- [x] **P0.17** Build `src/app/page.tsx` (dashboard): renders entry form + a simple Recharts bar chart of last 7 days miles
- [x] **P0.18** Enable Vercel deployment protection on the project (dashboard → Settings → Deployment Protection → "Standard Protection")
- [x] **P0.19** Deploy: `vercel --prod`; manually log one workout and confirm it renders on the chart
- [x] **P0.20** Tag commit `v0.1-vertical-slice`

**🎯 Checkpoint:** at this point one entry round-trips through the real stack. Phase 1+ can now parallelize.

---

## Phase 1 — Core features (parallel groups)

### Group A: Schema completion & calculations

> Self-contained — pure functions and DB schema. No UI dependencies.

- [x] **A1** Test `src/lib/__tests__/calc.test.ts` for `computeDistance(speedMph, minutes)`
- [x] **A2** Implement `src/lib/calc.ts` → `computeDistance`
- [x] **A3** Test `computeSteps(distanceMi, strideIn)` in same suite
- [x] **A4** Implement `computeSteps`
- [x] **A5** Test `computeCalories(speedMph, inclinePct, minutes, weightLb)` using ACSM MET formula — assert against 3 known values
- [x] **A6** Implement `computeCalories`
- [x] **A7** Extend `src/db/schema.ts`: add `workouts.source` (enum: `'treadmill' | 'outdoor'`), `notes`, `steps`, `calories`, `external_id` (nullable, unique), `updated_at`
- [x] **A8** Add `settings` table (singleton): `weight_lb`, `stride_in`, `daily_step_goal`, `weekly_miles_goal`, `timezone`, `health_ingest_secret`
- [x] **A9** Add `daily_metric` table: `date` (pk), `steps`, `distance_mi`, `active_calories`, `updated_at`
- [x] **A10** Generate + apply migration; verify against deployed DB via `drizzle-kit push --dry`
- [x] **A11** Test `getSettings()` / `upsertSettings()` repo
- [x] **A12** Implement `src/db/settings.repo.ts`
- [x] **A13** Seed default settings row in a migration or on first read

### Group B: Settings page & workout entry polish

> Depends on **A8, A11, A12** (settings repo) and **A1–A6** (calc functions).

- [x] **B1** Test `src/components/__tests__/settings-form.test.tsx` — loads current values, saves edits
- [x] **B2** Implement `src/app/settings/page.tsx` + `src/components/settings-form.tsx` (weight, stride, daily step goal, weekly miles goal, timezone)
- [x] **B3** Test `treadmill-entry-form` now sends computed `distance_mi`, `steps`, `calories` (using settings) along with raw fields
- [x] **B4** Update form: load settings on mount, compute on submit, send full row
- [x] **B5** Test API route validates and stores all new columns
- [x] **B6** Update `POST /api/workouts` to accept and persist full row; set `source='treadmill'`, `end_at=now`, `start_at=now-minutes`
- [x] **B7** Add Sonner toast on save success/failure
- [x] **B8** Test `PATCH /api/workouts/[id]` (edit) and `DELETE /api/workouts/[id]`
- [x] **B9** Implement edit + delete API routes
- [x] **B10** Test workout-list row component renders edit/delete affordances
- [x] **B11** Implement workout list with inline edit modal + delete confirm

### Group C: Apple Health backfill (zip upload)

> Self-contained until **F1** (dedup). Use a fixture XML to test the parser.

- [x] **C1** Create `src/lib/health-import/__fixtures__/sample-export.xml` — small hand-crafted XML with 3 days of steps, 1 walking workout
- [x] **C2** Test `parseHealthExport(xmlStream)` returns `{ dailyMetrics: [...], workouts: [...] }`
- [x] **C3** Implement `src/lib/health-import/parse.ts` using `sax` streaming parser
- [x] **C4** Test aggregation: multiple `HKQuantityTypeIdentifierStepCount` records on same local date sum into one `daily_metric`
- [x] **C5** Implement aggregation logic
- [x] **C6** Test idempotent upsert: importing the same file twice doesn't duplicate rows (workouts dedup on `external_id`, metrics on `date`)
- [x] **C7** Implement `importHealthData(parsed)` in `src/lib/health-import/import.ts`
- [x] **C8** Test `POST /api/health/import` accepts multipart zip, unzips, streams parser, returns counts
- [x] **C9** Implement route — use Vercel Workflow for long-running parse (PRD §7); return job ID, poll for status
- [x] **C10** Add upload UI to Settings page with progress indicator
- [x] **C11** End-to-end manual test with a real Apple Health export

### Group D: Apple Health streaming (Health Auto Export)

> Independent from C — different endpoint, different shape. Touches `daily_metric` and `workout` repos.

- [x] **D1** Test `POST /api/health/ingest` rejects requests without valid `Authorization: Bearer <secret>`
- [x] **D2** Implement bearer-secret middleware/guard checking `settings.health_ingest_secret`
- [x] **D3** Test ingest endpoint accepts the Health Auto Export JSON shape (PRD §6.4) and upserts daily_metrics
- [x] **D4** Test it also upserts workouts on `external_id`
- [x] **D5** Implement `src/app/api/health/ingest/route.ts`
- [x] **D6** Add "Health Ingest" section to Settings: show URL, show + regenerate secret, copy-to-clipboard, paste-into-app instructions block
- [x] **D7** Test secret regeneration invalidates the old one (old token returns 401 afterward)
- [x] **D8** Implement secret rotation endpoint + UI button

---

## Phase 2 — Dashboard (parallel groups, depend on Phase 1 data)

### Group E: Dedup logic

> Depends on **A8, A9, C7** (schema + import) so test data exists. Pure functions.

- [x] **E1** Test `src/lib/__tests__/dedup.test.ts`: `displayedDailyTotals(date, phoneMetric, treadmillWorkouts)` returns expected steps/distance/calories per PRD §6.2
- [x] **E2** Implement `src/lib/dedup.ts`
- [x] **E3** Test edge cases: no treadmill workout (passthrough); treadmill steps > phone steps (clamp to 0 then add); multiple treadmill workouts in one day
- [x] **E4** Refine impl to pass edge cases
- [x] **E5** Test `getDailyTotalsRange(start, end)` repo function that joins daily_metric + workouts and applies dedup
- [x] **E6** Implement aggregator in `src/db/totals.repo.ts`

### Group F: Charts

> Depends on **E5, E6**. Each chart is independent — split among agents if desired.

- [x] **F1** Install `recharts` and `react-activity-calendar`
- [x] **F2** Test `<DailyStepsBar>` component renders given totals array, respects 30/90/365 prop
- [x] **F3** Implement daily steps bar (stacked: treadmill vs outdoor portion, horizontal goal line)
- [x] **F4** Test `<WeeklyMilesLine>` computes weekly buckets + 4-week rolling average
- [x] **F5** Implement weekly miles line chart
- [x] **F6** Test `<YearHeatmap>` formats data for react-activity-calendar
- [x] **F7** Implement year heatmap
- [x] **F8** Test `<PaceTrend>` and `<InclineTrend>` (weekly averages of treadmill workouts)
- [x] **F9** Implement pace + incline trend line charts

### Group G: Cards, streaks, PRs

> Depends on **E5, E6**. Streak/PR logic is pure functions — test-first.

- [x] **G1** Test `computeStreak(dailyTotals, goal)` returns current consecutive days hitting goal
- [x] **G2** Implement `src/lib/streak.ts`
- [x] **G3** Test `<TodayCard>`, `<StreakCard>`, `<WeekCard>`, `<YtdCard>` render correct values
- [x] **G4** Implement each card component
- [x] **G5** Test `computePRs(workouts, dailyTotals)` returns `{ longestWalkMinutes, fastestAvgSpeed, mostStepsDay, longestStreak }`
- [x] **G6** Implement `src/lib/prs.ts`
- [x] **G7** Test `<PrsPanel>` shows current PRs and a "new" badge when `pr.set_at` is within 7 days
- [x] **G8** Implement PRs panel
- [x] **G9** Wire all cards + charts into `src/app/page.tsx`; remove the Phase 0 placeholder chart

### Group H: Workout list & unified outdoor display

> Depends on **B8–B11**, **C7**. Touches list UI.

- [x] **H1** Test workout list shows both `treadmill` and `outdoor` rows with source badge
- [x] **H2** Implement unified list with source filter chips
- [x] **H3** Test pagination / infinite scroll for >100 workouts
- [x] **H4** Implement pagination

---

## Phase 3 — PWA & offline

> All depend on Phase 0 being deployed. Group I can run in parallel with any Phase 2 group.

### Group I: PWA shell & offline save queue

- [x] **I1** Add `public/manifest.json` with name, icons (192/512), `display: standalone`, theme color
- [x] **I2** Generate icon set (use a simple footprint or treadmill emoji on solid bg)
- [x] **I3** Add `<link rel="manifest">` and apple-touch-icon meta to `app/layout.tsx`
- [x] **I4** Manually test add-to-home-screen on iOS Safari _(verified on device: footprint icon installs, opens standalone full-screen)_
- [x] **I5** Test offline-queue helper `src/lib/offline-queue.ts`: queues a workout when offline, replays on `online` event
- [x] **I6** Implement offline-queue using IndexedDB (`idb-keyval`)
- [x] **I7** Wire entry form to use queue when `navigator.onLine === false`
- [x] **I8** Add service worker (Workbox via `next-pwa` or custom minimal SW) for app-shell caching
- [x] **I9** Test offline scenario manually: airplane mode → log workout → reconnect → verify save _(verified on device: queued offline, auto-synced on reconnect)_

---

## Phase 4 — Polish & v1 cutover

> Final group. Mostly sequential.

### Group J: Export, danger zone, deploy

- [x] **J1** Test `GET /api/export.csv` returns all workouts + daily_metrics as one zipped CSV bundle _(route at `/api/export`, returns a `.zip` of two CSVs)_
- [x] **J2** Implement export route
- [x] **J3** Add "Export CSV" button to Settings
- [x] **J4** Test `DELETE /api/all-data` (with confirmation header) wipes user data _(DB mocked — route is an unscoped delete, must not run against the shared dev DB)_
- [x] **J5** Implement danger-zone delete with double-confirm UI
- [x] **J6** Audit timezone handling end-to-end (entry timestamps, daily bucketing, heatmap day boundaries — all use `settings.timezone`) _(core pipeline tz-correct; fixed workout-list display to use settings.timezone, removed dead aggregate-daily, documented ingest's phone-local-date assumption)_
- [x] **J7** Add error boundaries on each dashboard section
- [x] **J8** Run Lighthouse on prod; address any a11y issues _(prod Lighthouse: Accessibility 100, Best Practices 100, SEO 100, Performance 63. a11y fixes: CardTitle is a real heading, ingest URL/token + import file inputs labeled)_
- [x] **J9** Backfill: run the real Apple Health export through `/api/health/import` against prod _(1,774 daily metrics present in the prod DB; Blob upload path for >4MB files deployed + tested. Final browser-upload confirmation on the live site optional — idempotent)_
- [x] **J10** Set up Health Auto Export iOS app pointing at prod ingest URL; verify next-day sync arrives _(verified live: manual export from phone POSTed Jun 16-22 real data to the prod ingest endpoint; landed with steps/distance/calories correct)_
- [x] **J11** Tag commit `v1.0`

---

## Phase 5 — Public face & single-user auth (v2)

> Implements [PRD.md](./PRD.md) v2 (§4 Audiences, §6 access map, §7 passkey auth, §8 recruiter surface, §12 going-public checklist). Goal: a public read-only dashboard + `/about` case study that a recruiter can open with no login, while all writes are gated behind a single-user passkey.
>
> **Order matters.** Group K is foundational and blocking — it must land before Group N can remove deployment protection (don't lock yourself out). Groups L and M can parallelize once K's session + `requireOwner()` exist. Group N is the final cutover.
>
> **Hard rule:** deployment protection stays ON until K is done, a passkey is registered, and L's guards are verified on every owner-only route in a preview deploy.

### Group K: Passkey auth (WebAuthn) — FOUNDATIONAL, do first

> Self-contained. Delivers register → login → session → guard. No public-surface changes yet.

- [x] **K1** Install `@simplewebauthn/server` + `@simplewebauthn/browser`; chose **`jose`**-signed cookie for the session; generated `SESSION_SECRET` + `BOOTSTRAP_REGISTRATION_SECRET` into `.env.local` _(still TODO: add both to Vercel env before any preview/prod deploy — see K9/K16)_
- [x] **K2** Extend `src/db/schema.ts`: added `webauthn_credential` (id, public_key as base64url text, counter bigint, transports text[], device_label, created_at, last_used_at) and `webauthn_challenge` (challenge pk, type enum, expires_at). Migration `0002_last_silver_samurai.sql` generated + applied; tables verified in DB
- [x] **K3** Test `src/db/__tests__/credentials.repo.test.ts` — save, fetch-by-id (+null), list, count, update counter/last_used, delete; scoped cleanup via `test-cred-*` ids (7 tests)
- [x] **K4** Implement `src/db/credentials.repo.ts` (`saveCredential`, `getCredentialById`, `listCredentials`, `countCredentials`, `updateCredentialCounter`, `deleteCredential`)
- [x] **K5** Test `src/db/__tests__/challenges.repo.test.ts` — single-use consume-on-read, reject expired, type isolation, latest-of-type (4 tests)
- [x] **K6** Implement `src/db/challenges.repo.ts` (`createChallenge` with TTL, `consumeChallenge(type)` atomic delete-returning; default 5-min TTL)
- [x] **K7** Test `src/lib/__tests__/session.test.ts` — token mint/verify, reject tampered/expired/garbage, cookie set→getSession, clear→logout, `requireOwner` returns/throws (8 tests; `next/headers` mocked)
- [x] **K8** Implement `src/lib/session.ts` — `jose` HS256 signed JWT, httpOnly/Secure/SameSite=Lax cookie, **30-day rolling** session, `createSessionToken`/`verifySessionToken`/`setSessionCookie`/`clearSessionCookie`/`getSession`/`requireOwner`/`UnauthorizedError`
- [x] **K9** Test `src/app/api/auth/register/__tests__/route.test.ts` — options + verify gating (403 no/bad secret, 403 when creds exist w/o session, 200 on zero-creds or session) and verify error paths (400 missing response / expired challenge / failed attestation). 9 tests; DB+session mocked, real `@simplewebauthn`. _(Real attestation happy-path → K16 on device.)_
- [x] **K10** Implement `src/lib/webauthn.ts` (RP config from Origin, `isRegistrationAllowed` gate) + `register/options/route.ts` (`generateRegistrationOptions`, excludeCredentials) + `register/verify/route.ts` (`verifyRegistrationResponse`, store base64url pubkey, set session on success)
- [x] **K11** Test `src/app/api/auth/login/__tests__/route.test.ts` — options returns challenge + allowCredentials & stores auth challenge; verify error paths (400 missing/expired, 401 unknown credential, 400 failed assertion). 6 tests; DB+session mocked. _(Real assertion happy-path + counter bump → K16 on device.)_
- [x] **K12** Implement `login/options/route.ts` (`generateAuthenticationOptions`, allowCredentials) + `login/verify/route.ts` (`verifyAuthenticationResponse` against stored base64url pubkey, `updateCredentialCounter` to catch cloned authenticators, set session)
- [x] **K13** Test `src/app/api/auth/logout/__tests__/route.test.ts` — calls `clearSessionCookie`, returns `{ ok: true }` (1 test)
- [x] **K14** Implement `logout/route.ts`
- [x] **K15** Build `src/app/login/page.tsx` (unadvertised, `robots: noindex`) + `src/components/login-panel.tsx` — passkey login (`startAuthentication`) and a bootstrap-secret-gated register form (`startRegistration`, used by K16), redirect to `/` on success. Test `login-panel.test.tsx` (3 tests, browser lib + fetch mocked). Full suite green (166 tests); prod build compiles all auth routes + `/login`.
- [~] **K16** Register first passkey (iPhone Face ID) + laptop as 2nd device; verify login round-trips. **In progress.**
  - [x] Env on Vercel Production+Development: `SESSION_SECRET`, `BOOTSTRAP_REGISTRATION_SECRET`, `RP_ID=olympic.evanappel.me`, `RP_ORIGIN=https://olympic.evanappel.me`
  - [x] Decided permanent domain: **olympic.evanappel.me** (passkey rpID + resume link); attached to project
  - [x] Deployed v2 auth code to Production (additive; still behind deployment protection); aliased to olympic.evanappel.me
  - [ ] **Blocked on DNS:** add `A olympic → 76.76.21.21` at Wix (evanappel.me nameservers = ns6/ns7.wixdns.net); wait for Vercel verification + cert
  - [ ] **Interim (while DNS propagates):** work against the default Vercel domain **`olympic-lime-six.vercel.app`**. For passkeys to work there, set Vercel env `RP_ID=olympic-lime-six.vercel.app` + `RP_ORIGIN=https://olympic-lime-six.vercel.app` (or **unset** both — `getRpConfig` falls back to the request Origin), then redeploy. Swap back to `olympic.evanappel.me` once the A record verifies.
  - [ ] On iPhone: open `https://olympic-lime-six.vercel.app/login` → "Register a device" → paste `BOOTSTRAP_REGISTRATION_SECRET` (from `.env.local`) → Face ID
  - [ ] Confirm login round-trips; register laptop as 2nd device
  - [ ] After first credential registered: consider rotating/removing `BOOTSTRAP_REGISTRATION_SECRET` (N-phase)

### Group L: Access control & public/private split

> Depends on **K7, K8** (session + `requireOwner`). Applies the guards and the public read scoping.

- [ ] **L1** Test `requireOwner()` guard: owner-only routes return 401/redirect without a valid session, 200 with one
- [ ] **L2** Apply `requireOwner()` to `POST/PATCH/DELETE /api/workouts*`, `GET/POST /api/settings`, `POST /api/health/import`, `GET /api/export`, `DELETE /api/all-data`, and the `/settings` page
- [ ] **L3** Test `GET /api/health/secret` now requires a session (closes the audit-flagged hole: it previously returned the ingest secret unauthenticated)
- [ ] **L4** Gate / remove the standalone secret-read route; surface the secret only through the owner-guarded Settings flow
- [ ] **L5** Test public dashboard DTOs: serializers for cards/charts/workout-list/PRs return only whitelisted fields and **never** include `health_ingest_secret` or settings credentials
- [ ] **L6** Implement read DTOs / field whitelists for all public dashboard endpoints
- [ ] **L7** Test `src/app/page.tsx` renders read-only for anonymous requests and shows edit/delete + Settings affordances only when a session is present
- [ ] **L8** Implement owner-mode vs public-mode rendering (server-side session check); confirm `/api/health/ingest` bearer path is untouched by session logic
- [ ] **L9** Add `robots.txt` / metadata: allow `/` and `/about`, disallow `/app`, `/settings`, `/login`

### Group M: Recruiter surface (header identity + /about)

> Mostly independent; depends on **K15/L7** only for hiding the login entrance and owner-mode affordances. Can parallelize with L.

- [x] **M1** Copy `~/Documents/career/resumes/resume_ai_engineer.pdf` → `public/resume.pdf` _(done)_
- [ ] **M2** Test `<SiteHeader>` renders name + links (GitHub `EvanWAppel/olympic`, LinkedIn `evan-appel-8885569b`, Resume `/resume.pdf`, email `mailto:appelew@gmail.com`, personal site) and an "About this build" link; renders no login button
- [ ] **M3** Implement `src/components/site-header.tsx`; mount in `app/layout.tsx`. _(Personal-site deployed URL is TBD — link the `enki` repo as a placeholder until the live domain is confirmed.)_
- [ ] **M4** Test live-metrics helper `getAboutMetrics()` — total workouts, days of data, current streak, test count (queried, not hardcoded)
- [ ] **M5** Implement `getAboutMetrics()` (reuse existing totals/streak repos)
- [ ] **M6** Build `src/app/about/page.tsx` — personal narrative, architecture + data-flow diagram, decision log/tradeoffs, stack + live metrics (PRD §8.2)
- [ ] **M7** Author the architecture/data-flow diagram (SVG or static asset) showing Apple Health → ingest → dedup → dashboard
- [ ] **M8** Snapshot/visual check the public dashboard + `/about` as anonymous: no empty states, no broken charts, no auth wall

### Group N: Going-public cutover (FINAL, sequential)

> Depends on **K, L, M** complete and verified on a preview deploy. This is the §12 checklist — do not skip a box.

- [ ] **N1** Audit git history for secrets (`health_ingest_secret`, `DATABASE_URL`, `SESSION_SECRET`, `BOOTSTRAP_REGISTRATION_SECRET`, any `.env`); scrub with `git filter-repo` if found
- [ ] **N2** Rotate the `health_ingest_secret` to a fresh value; reconfigure Health Auto Export on the phone; confirm next sync lands
- [ ] **N3** Replace the default `create-next-app` README with a real one (what/why, agentic-build story, stack, screenshots, live URL, run instructions)
- [ ] **N4** Add Vercel Firewall / WAF rate limits on `/api/health/ingest`, `/api/auth/login/*`, `/api/auth/register/*`
- [ ] **N5** Verify on the preview deploy that NO private surface (Settings, ingest secret, write endpoints) is reachable by an anonymous request
- [ ] **N6** Remove Vercel deployment protection (Settings → Deployment Protection → off) — only after N5 passes and a passkey login is confirmed working in prod
- [ ] **N7** Smoke-test prod as anonymous (dashboard + `/about` load, links work, resume downloads) and as owner (login → log a workout → it appears)
- [ ] **N8** Tag commit `v2.0-public`

---

## Notes for parallel agents

- **Branch per group**: `feat/group-a-calc`, `feat/group-c-health-import`, etc.
- **Shared schema**: Group A owns `src/db/schema.ts`. Other groups must rebase after A merges, not edit schema directly.
- **Shared dashboard page**: `src/app/page.tsx` is touched by F, G, H. Coordinate via small, additive commits or assign one integrator.
- **Test database**: use a separate Neon branch for tests (free), or run an embedded PGlite. Don't run tests against the prod DB.
- **No skipping tests**: if a test is hard to write, the design is wrong. Stop and ask.
