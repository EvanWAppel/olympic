# Olympic — Build Tasks

Implementation tasks for [PRD.md](./PRD.md). All work is **TDD**: write the test first, watch it fail, then implement until it passes. Each numbered ID is a small unit of work (~15–60 min). Check off `[ ]` → `[x]` as you complete.

## Reading guide

- **Phase 0** is sequential and blocking. Do it first, in order. It delivers a deployed end-to-end vertical slice: log a treadmill workout → see it on a chart, in prod.
- **Phases 1+** are organized into parallel **groups** (A, B, C, …). Each group is a workstream that an agent can claim independently. Within a group, tasks are sequential. Dependencies between groups are noted at the top of each group.
- **TDD pairing**: a `*.test` task always precedes its implementation task. Don't merge them.

---

## Phase 0 — Vertical slice (SEQUENTIAL, ship to prod first)

**Goal:** working deployed app that accepts a treadmill workout entry and shows today's steps on a bar chart. No calculations beyond `distance = speed × hours`. No Apple Health. No styling polish. Pure stack proof.

- [ ] **P0.1** Run `pnpm create next-app olympic-app --typescript --tailwind --app --eslint --src-dir --no-import-alias` in this dir (or in-place if config allows); commit initial scaffold
- [ ] **P0.2** Initialize git repo, push to GitHub (private)
- [ ] **P0.3** Install and init shadcn/ui (`pnpm dlx shadcn@latest init`); add components: `button`, `input`, `label`, `card`, `form`, `sonner`
- [ ] **P0.4** Install Vitest + React Testing Library + jsdom + `@testing-library/jest-dom`; add `test` script; create `vitest.config.ts` and `vitest.setup.ts`
- [ ] **P0.5** Write smoke test `src/lib/__tests__/smoke.test.ts` asserting `1 + 1 === 2`; run `pnpm test` and verify it passes
- [ ] **P0.6** Provision Neon Postgres via Vercel Marketplace; link project (`vercel link`, `vercel env pull .env.local`)
- [ ] **P0.7** Install Drizzle ORM + `drizzle-kit` + `@neondatabase/serverless`; configure `drizzle.config.ts` pointing at `DATABASE_URL`
- [ ] **P0.8** Define minimal `workout` table in `src/db/schema.ts` — columns: `id`, `start_at`, `end_at`, `minutes`, `speed_mph`, `incline_pct`, `distance_mi`, `created_at`. Generate + apply migration
- [ ] **P0.9** Write test `src/db/__tests__/workouts.repo.test.ts` for `createWorkout()` and `listWorkouts()` (use a test database URL or transactional rollback)
- [ ] **P0.10** Implement `src/db/workouts.repo.ts` with `createWorkout()` and `listWorkouts()`; tests pass
- [ ] **P0.11** Write test `src/app/api/workouts/__tests__/route.test.ts` for `POST /api/workouts` (accepts speed/incline/minutes, returns saved row)
- [ ] **P0.12** Implement `src/app/api/workouts/route.ts` (POST handler); tests pass
- [ ] **P0.13** Write test `src/components/__tests__/treadmill-entry-form.test.tsx` — renders fields, submits, calls handler with parsed values
- [ ] **P0.14** Implement `src/components/treadmill-entry-form.tsx` (shadcn Form, three inputs, Save button); tests pass
- [ ] **P0.15** Write test `src/lib/__tests__/aggregate-daily.test.ts` for `aggregateDailyMiles(workouts)` (groups by date, sums miles)
- [ ] **P0.16** Implement `src/lib/aggregate-daily.ts`; tests pass
- [ ] **P0.17** Build `src/app/page.tsx` (dashboard): renders entry form + a simple Recharts bar chart of last 7 days miles
- [ ] **P0.18** Enable Vercel deployment protection on the project (dashboard → Settings → Deployment Protection → "Standard Protection")
- [ ] **P0.19** Deploy: `vercel --prod`; manually log one workout and confirm it renders on the chart
- [ ] **P0.20** Tag commit `v0.1-vertical-slice`

**🎯 Checkpoint:** at this point one entry round-trips through the real stack. Phase 1+ can now parallelize.

---

## Phase 1 — Core features (parallel groups)

### Group A: Schema completion & calculations

> Self-contained — pure functions and DB schema. No UI dependencies.

- [ ] **A1** Test `src/lib/__tests__/calc.test.ts` for `computeDistance(speedMph, minutes)`
- [ ] **A2** Implement `src/lib/calc.ts` → `computeDistance`
- [ ] **A3** Test `computeSteps(distanceMi, strideIn)` in same suite
- [ ] **A4** Implement `computeSteps`
- [ ] **A5** Test `computeCalories(speedMph, inclinePct, minutes, weightLb)` using ACSM MET formula — assert against 3 known values
- [ ] **A6** Implement `computeCalories`
- [ ] **A7** Extend `src/db/schema.ts`: add `workouts.source` (enum: `'treadmill' | 'outdoor'`), `notes`, `steps`, `calories`, `external_id` (nullable, unique), `updated_at`
- [ ] **A8** Add `settings` table (singleton): `weight_lb`, `stride_in`, `daily_step_goal`, `weekly_miles_goal`, `timezone`, `health_ingest_secret`
- [ ] **A9** Add `daily_metric` table: `date` (pk), `steps`, `distance_mi`, `active_calories`, `updated_at`
- [ ] **A10** Generate + apply migration; verify against deployed DB via `drizzle-kit push --dry`
- [ ] **A11** Test `getSettings()` / `upsertSettings()` repo
- [ ] **A12** Implement `src/db/settings.repo.ts`
- [ ] **A13** Seed default settings row in a migration or on first read

### Group B: Settings page & workout entry polish

> Depends on **A8, A11, A12** (settings repo) and **A1–A6** (calc functions).

- [ ] **B1** Test `src/components/__tests__/settings-form.test.tsx` — loads current values, saves edits
- [ ] **B2** Implement `src/app/settings/page.tsx` + `src/components/settings-form.tsx` (weight, stride, daily step goal, weekly miles goal, timezone)
- [ ] **B3** Test `treadmill-entry-form` now sends computed `distance_mi`, `steps`, `calories` (using settings) along with raw fields
- [ ] **B4** Update form: load settings on mount, compute on submit, send full row
- [ ] **B5** Test API route validates and stores all new columns
- [ ] **B6** Update `POST /api/workouts` to accept and persist full row; set `source='treadmill'`, `end_at=now`, `start_at=now-minutes`
- [ ] **B7** Add Sonner toast on save success/failure
- [ ] **B8** Test `PATCH /api/workouts/[id]` (edit) and `DELETE /api/workouts/[id]`
- [ ] **B9** Implement edit + delete API routes
- [ ] **B10** Test workout-list row component renders edit/delete affordances
- [ ] **B11** Implement workout list with inline edit modal + delete confirm

### Group C: Apple Health backfill (zip upload)

> Self-contained until **F1** (dedup). Use a fixture XML to test the parser.

- [ ] **C1** Create `src/lib/health-import/__fixtures__/sample-export.xml` — small hand-crafted XML with 3 days of steps, 1 walking workout
- [ ] **C2** Test `parseHealthExport(xmlStream)` returns `{ dailyMetrics: [...], workouts: [...] }`
- [ ] **C3** Implement `src/lib/health-import/parse.ts` using `sax` streaming parser
- [ ] **C4** Test aggregation: multiple `HKQuantityTypeIdentifierStepCount` records on same local date sum into one `daily_metric`
- [ ] **C5** Implement aggregation logic
- [ ] **C6** Test idempotent upsert: importing the same file twice doesn't duplicate rows (workouts dedup on `external_id`, metrics on `date`)
- [ ] **C7** Implement `importHealthData(parsed)` in `src/lib/health-import/import.ts`
- [ ] **C8** Test `POST /api/health/import` accepts multipart zip, unzips, streams parser, returns counts
- [ ] **C9** Implement route — use Vercel Workflow for long-running parse (PRD §7); return job ID, poll for status
- [ ] **C10** Add upload UI to Settings page with progress indicator
- [ ] **C11** End-to-end manual test with a real Apple Health export

### Group D: Apple Health streaming (Health Auto Export)

> Independent from C — different endpoint, different shape. Touches `daily_metric` and `workout` repos.

- [ ] **D1** Test `POST /api/health/ingest` rejects requests without valid `Authorization: Bearer <secret>`
- [ ] **D2** Implement bearer-secret middleware/guard checking `settings.health_ingest_secret`
- [ ] **D3** Test ingest endpoint accepts the Health Auto Export JSON shape (PRD §6.4) and upserts daily_metrics
- [ ] **D4** Test it also upserts workouts on `external_id`
- [ ] **D5** Implement `src/app/api/health/ingest/route.ts`
- [ ] **D6** Add "Health Ingest" section to Settings: show URL, show + regenerate secret, copy-to-clipboard, paste-into-app instructions block
- [ ] **D7** Test secret regeneration invalidates the old one (old token returns 401 afterward)
- [ ] **D8** Implement secret rotation endpoint + UI button

---

## Phase 2 — Dashboard (parallel groups, depend on Phase 1 data)

### Group E: Dedup logic

> Depends on **A8, A9, C7** (schema + import) so test data exists. Pure functions.

- [ ] **E1** Test `src/lib/__tests__/dedup.test.ts`: `displayedDailyTotals(date, phoneMetric, treadmillWorkouts)` returns expected steps/distance/calories per PRD §6.2
- [ ] **E2** Implement `src/lib/dedup.ts`
- [ ] **E3** Test edge cases: no treadmill workout (passthrough); treadmill steps > phone steps (clamp to 0 then add); multiple treadmill workouts in one day
- [ ] **E4** Refine impl to pass edge cases
- [ ] **E5** Test `getDailyTotalsRange(start, end)` repo function that joins daily_metric + workouts and applies dedup
- [ ] **E6** Implement aggregator in `src/db/totals.repo.ts`

### Group F: Charts

> Depends on **E5, E6**. Each chart is independent — split among agents if desired.

- [ ] **F1** Install `recharts` and `react-activity-calendar`
- [ ] **F2** Test `<DailyStepsBar>` component renders given totals array, respects 30/90/365 prop
- [ ] **F3** Implement daily steps bar (stacked: treadmill vs outdoor portion, horizontal goal line)
- [ ] **F4** Test `<WeeklyMilesLine>` computes weekly buckets + 4-week rolling average
- [ ] **F5** Implement weekly miles line chart
- [ ] **F6** Test `<YearHeatmap>` formats data for react-activity-calendar
- [ ] **F7** Implement year heatmap
- [ ] **F8** Test `<PaceTrend>` and `<InclineTrend>` (weekly averages of treadmill workouts)
- [ ] **F9** Implement pace + incline trend line charts

### Group G: Cards, streaks, PRs

> Depends on **E5, E6**. Streak/PR logic is pure functions — test-first.

- [ ] **G1** Test `computeStreak(dailyTotals, goal)` returns current consecutive days hitting goal
- [ ] **G2** Implement `src/lib/streak.ts`
- [ ] **G3** Test `<TodayCard>`, `<StreakCard>`, `<WeekCard>`, `<YtdCard>` render correct values
- [ ] **G4** Implement each card component
- [ ] **G5** Test `computePRs(workouts, dailyTotals)` returns `{ longestWalkMinutes, fastestAvgSpeed, mostStepsDay, longestStreak }`
- [ ] **G6** Implement `src/lib/prs.ts`
- [ ] **G7** Test `<PrsPanel>` shows current PRs and a "new" badge when `pr.set_at` is within 7 days
- [ ] **G8** Implement PRs panel
- [ ] **G9** Wire all cards + charts into `src/app/page.tsx`; remove the Phase 0 placeholder chart

### Group H: Workout list & unified outdoor display

> Depends on **B8–B11**, **C7**. Touches list UI.

- [ ] **H1** Test workout list shows both `treadmill` and `outdoor` rows with source badge
- [ ] **H2** Implement unified list with source filter chips
- [ ] **H3** Test pagination / infinite scroll for >100 workouts
- [ ] **H4** Implement pagination

---

## Phase 3 — PWA & offline

> All depend on Phase 0 being deployed. Group I can run in parallel with any Phase 2 group.

### Group I: PWA shell & offline save queue

- [ ] **I1** Add `public/manifest.json` with name, icons (192/512), `display: standalone`, theme color
- [ ] **I2** Generate icon set (use a simple footprint or treadmill emoji on solid bg)
- [ ] **I3** Add `<link rel="manifest">` and apple-touch-icon meta to `app/layout.tsx`
- [ ] **I4** Manually test add-to-home-screen on iOS Safari
- [ ] **I5** Test offline-queue helper `src/lib/offline-queue.ts`: queues a workout when offline, replays on `online` event
- [ ] **I6** Implement offline-queue using IndexedDB (`idb-keyval`)
- [ ] **I7** Wire entry form to use queue when `navigator.onLine === false`
- [ ] **I8** Add service worker (Workbox via `next-pwa` or custom minimal SW) for app-shell caching
- [ ] **I9** Test offline scenario manually: airplane mode → log workout → reconnect → verify save

---

## Phase 4 — Polish & v1 cutover

> Final group. Mostly sequential.

### Group J: Export, danger zone, deploy

- [ ] **J1** Test `GET /api/export.csv` returns all workouts + daily_metrics as one zipped CSV bundle
- [ ] **J2** Implement export route
- [ ] **J3** Add "Export CSV" button to Settings
- [ ] **J4** Test `DELETE /api/all-data` (with confirmation header) wipes user data
- [ ] **J5** Implement danger-zone delete with double-confirm UI
- [ ] **J6** Audit timezone handling end-to-end (entry timestamps, daily bucketing, heatmap day boundaries — all use `settings.timezone`)
- [ ] **J7** Add error boundaries on each dashboard section
- [ ] **J8** Run Lighthouse on prod; address any a11y issues
- [ ] **J9** Backfill: run the real Apple Health export through `/api/health/import` against prod
- [ ] **J10** Set up Health Auto Export iOS app pointing at prod ingest URL; verify next-day sync arrives
- [ ] **J11** Tag commit `v1.0`

---

## Notes for parallel agents

- **Branch per group**: `feat/group-a-calc`, `feat/group-c-health-import`, etc.
- **Shared schema**: Group A owns `src/db/schema.ts`. Other groups must rebase after A merges, not edit schema directly.
- **Shared dashboard page**: `src/app/page.tsx` is touched by F, G, H. Coordinate via small, additive commits or assign one integrator.
- **Test database**: use a separate Neon branch for tests (free), or run an embedded PGlite. Don't run tests against the prod DB.
- **No skipping tests**: if a test is hard to write, the design is wrong. Stop and ask.
