# DECISIONS — Olympic

Append-only log of decisions with a real trade-off (chose X, rejected Y, why). Newest last.

---

## 2026-09-27 — Phase 6 (v3) portfolio-signal scope, build order, and AI gating

**Context.** v2 made Olympic a credible public portfolio piece. Question was which features would most raise its attractiveness to recruiters, and in what order to build.

**Decisions.**
- **Scope:** adopt seven v3 features (PRD §15): real README, CI + badges, Lighthouse perf 63→90+, AI movement insights, dynamic OG images + year recap, goal-setting + projections, production-maturity touches. Rejected: expanding the audience model (multi-user/sign-up) — stays out of scope to keep the surface small.
- **Build first: README + CI (Group O).** Chosen over the flashier AI/OG work because it's the highest signal-per-effort (the repo landing page is the first thing a recruiter sees, and the default `create-next-app` README is an active negative signal) and is fully guardrail-clear (no deploy, no external key). Rejected "build the AI centerpiece first" because it's blocked (below) and can't start.
- **AI insights parked in `BLOCKED.md`, not built now.** The app is public and unauthenticated, so wiring any LLM key triggers the owner's personal-API-key guardrail. Chose to record the four-point checklist (isolated Gateway workspace, scoped key, hard spend cap, explicit confirmation) as a blocker and proceed with the other features. Rejected "just use the personal key for a demo" — that's exactly the guardrail's forbidden case (Tiresias/Elvis incident).
- **Created `BLOCKED.md` + `DECISIONS.md`.** These standard artifacts were missing from the project; created to self-heal to the ROCRLL/global standard.

## 2026-09-30 — OG images (Group Q)

**Context.** Dynamic social card so pasting the site into LinkedIn/Slack unfurls live stats.

**Decisions.**
- **`next/og` `ImageResponse`** over a separate `@vercel/og` dependency — it's built into Next 16, one less dep. The route is `force-dynamic` so it reflects live data and doesn't run at build (no DB there).
- **New `src/lib/social-stats.ts`** rather than extending `about-metrics.ts` — about-metrics is purpose-shaped for the `/about` page and lacks miles; a focused, separately-tested aggregate keeps both clean. Same injectable-deps pattern for testability. Will be reused by the `/recap` page (Q3).
- **Added an env-gated `NEON_LOCAL_PROXY_URL` hook to `src/db/client.ts`** (not just the test setup). Trade-off: a tiny extra branch in the runtime client, in exchange for being able to run the real app against the local Postgres+proxy stack (so OG rendering could be verified by curl without a remote DB or browser). Guarded by the env var, so production is never affected.
- **Aggregate-only on the card.** No raw records — YTD miles, marathon-equivalent, streak, workout count, days tracked. Keeps the public surface safe and the figures shareable.

## 2026-10-01 — Dashboard performance (Group P)

**Context.** Prod Lighthouse Performance was 63 (a11y/BP/SEO all 100). Lighthouse itself needs a browser, which this environment keeps off by default.

**Decisions.**
- **Lazy-load the charts with `next/dynamic` (`ssr: false`)** rather than trying to shrink Recharts in place or swap charting libraries. Recharts (~383 KB) + the heatmap are all below the fold; deferring them took the dashboard's initial JS from 1218 KB → 826 KB (−32%) and off the critical path. Swapping libraries would be a much larger change for the same first-load benefit.
- **Reserve each chart's height in the skeleton** so deferral doesn't trade a JS win for a CLS regression.
- **Measured browser-free via the prod server's emitted `<script>`/modulepreload set**, not Lighthouse. Trade-off: this proves the initial-JS reduction (a strong TBT/LCP proxy) but not the Lighthouse number, which still needs one browser run to confirm ≥ 90. Chosen to respect the browser-off guardrail and still ship a verified improvement; the score is confirmed separately.

**Update (owner-approved headless Lighthouse run).** The JS cut alone moved the score only 63→65: the bottleneck was LCP 5.1 s, 85% *render-delay*. Root cause was a **text LCP waiting on the Geist webfont**, which next/font wasn't preloading because only the CSS `variable` was applied, not the font's `.className`. Decisions:
- **Apply `geistSans.className` to `<body>`** to trigger next/font's preload (keeping the CSS variables for `--font-geist-mono` usage). LCP 5.1 s → 3.1 s; Perf 65 → 82. Lowest-risk, highest-impact lever.
- **Parallelize the two independent reads in `getDailyTotalsRange`** (phone metrics + treadmill workouts) rather than caching the dashboard. Caching would cut TTFB more but needs tag-invalidation across every write route and risks staleness/dedup bugs; parallelizing is a pure, test-covered win (TTFB 0.74 s → 0.44 s) with no correctness surface.
- ~~Defer the below-the-fold WorkoutList~~ — superseded, see 2026-10-10.
- **Stopped at ~83 rather than chasing the last points with risky caching.** The local simulation is pessimistic (observed LCP 2.8 s); the real CDN-backed deploy should score higher, so the ≥ 90 confirmation belongs on prod. Deeper caching stays an option if prod falls short.

## 2026-10-10 — Keep the workout list server-rendered (Group P review)

**Context.** Adversarial review of `feat/perf-lighthouse` flagged (medium) that deferring `WorkoutList` with `next/dynamic` `ssr:false` removed the work log from the server HTML: crawlers, no-JS visitors, and link-preview scrapers saw only an unlabeled skeleton, and a failed chunk load would leave it a skeleton forever.

**Decision.** Revert that deferral; keep the font preload and parallel reads. Chose content-in-HTML over ~80 ms of TBT. The work log is the dashboard's substance on a public portfolio page, and the font + TTFB fixes carried most of the score gain anyway. Rejected keeping it deferred with an `aria-busy` skeleton: that's more accessible, but it still hides the content from crawlers and no-JS readers.

## 2026-10-10 — Year-in-movement recap (Q3)

**Context.** PRD §15.5 asks for a shareable year-in-review page. The owner chose per-year URLs and all four content blocks.

**Decisions.**
- **`/recap/[year]` with `/recap` redirecting to the newest year**, rather than a single current-year page. Each year gets a stable URL and its own OG card. Valid years run from the earliest data to the current local year; anything else 404s, so a guessed URL can't render an empty recap.
- **A new pure `buildYearRecap` plus a separate DB loader**, rather than extending `getSocialStats`. social-stats is shaped for the rolling "now" card (YTD, current streak), while the recap needs any calendar year. Reuses `bucketByWeek`, `computePRs`' longest streak, and `getDailyTotalsRange`, so dedup behaves the same as on the dashboard.
- **Workout counts and year bounds use the owner's local timezone in SQL** (`start_at at time zone tz`) instead of UTC. Otherwise a New Year's Eve evening walk counts toward the wrong year. Covered by a DB test.
- **The month strip is server-rendered CSS bars with an accessible `<ol>`**, not Recharts. That keeps the recap off the 383 KB chart bundle and readable without JS, consistent with the 2026-10-10 SSR decision.
- **The recap OG card falls back to a branded card on a DB error, and logs it** (`console.error` with a `[recap-og]` tag). Initially it let errors throw, per "don't hide errors". After review, the owner chose the fallback: a 500 means a broken unfurl wherever the link was shared. Logging keeps the failure visible in Vercel logs, so the error isn't hidden.
- **Review fixes:** the month data is real visually-hidden text, not `aria-label`, because screen readers handle that unevenly on `<li>`. The metadata never echoes an unvalidated path segment. A best week that starts in the previous December is labelled with its year.
- **Extracted the OG card chrome into `components/og-card.tsx`**, so the two cards can't drift apart in palette or layout.
- **Switched the `SITE_URL` default to `olympic.evanappel.me`.** DNS is now on Cloudflare and the cert is verified, so absolute OG and canonical URLs use the permanent domain.

## 2026-10-10 — Goal-setting + projections (Group R)

**Context.** PRD §15.6: the owner sets a yearly mile goal; the dashboard projects year-end miles; visitors see it read-only. The owner chose YTD pace + needed pace, inline editing on the card, a public goal, and distance landmarks.

**Decisions.**
- **Project from the YTD pace, not a trailing window.** It's steady day to day and easy to explain ("miles ÷ days × 365"). A trailing 4-week pace reacts faster but swings hard after a sick week. Today counts as elapsed, so morning projections lean slightly conservative instead of optimistic.
- **Ahead/behind is measured against the goal's straight-line pro-rata share to date**, and "needed" is the remaining miles over the remaining weeks. Rejected: seasonally weighted targets. They're more accurate for a walker, but they need history the model doesn't have, and they're hard to explain on a card.
- **Nullable column, no default goal.** "No goal" is a real state (the card then shows only the projection). Inventing a default would publish a target the owner never chose.
- **Migration is additive, and it gets applied to prod before merge.** Migrations here are manual (`pnpm db:migrate`), and `getSettings()` selects every column. If the code deploys first, the dashboard breaks. If the migration lands first, nothing breaks, because the old code ignores the extra column.
- **The editor is a small client island inside a server card**, reusing the owner-only `PATCH /api/settings`. Rejected: a new goal endpoint, which would duplicate the guard for no gain. Rejected: making the whole card a client component, which would add JS for every anonymous visitor.
- **Landmarks: pick the one closest in scale (smallest |log ratio|)**, shown as a share when short ("68% of the Appalachian Trail") or a multiple when past it. Rejected "largest landmark not exceeded": it yields flat, big multiples like "2.9× the Camino" where "66% of the AT" reads better. Distances are commonly cited, rounded route lengths, and the list is hand-curated so the owner can edit it.
- **Review fixes (owner-chosen).**
  - Ahead/behind wording follows `status`, so a sub-0.5% gap reads "Just behind pace", never "0% ahead".
  - The editor field resyncs after a clear.
  - The API goal minimum is 1, matching the UI and avoiding `numeric(6,1)` rounding 0.04 to 0.
  - Landmarks:
    - "Britain end to end" is set at a walking-route 1,200 mi instead of the 874 mi road figure.
    - "a lap of the Earth" replaces "the way around the Earth".
    - "about as far as X" replaces "the length of X".
  - The dashboard's data window starts at `trailingYearStart(today)` (never after Jan 1), which fixes a pre-existing leap-year gap where Dec 31 dropped Jan 1 from YTD.
- **Demo goal 1,500 mi** (not 15 mi/week × 52 = 780), so `/demo` shows an in-progress goal instead of "Goal met".

## 2026-10-10 — Production exposure: v1 build leaked the Health ingest secret (incident)

**What happened.** While verifying a schema change, a smoke test of `olympic.evanappel.me` showed that production was still a **v1 deployment from 2026-07-01**. Deploys were manual (`vercel --prod`), and none had run since. Vercel Deployment Protection was **off** for the project. v1 predates the v2 owner guards, so anonymous requests could:
- read `GET /api/settings`, including `healthIngestSecret` (presence checked by key only; the value was never printed);
- reach v1's write routes (`POST /api/workouts` got as far as validation).

Six older v1 deployment URLs (`*-evan-appel-s-projects.vercel.app`) served the same thing. The exposure probably dates from that deploy on `olympic-lime-six.vercel.app`, and the custom domain carried it from when DNS went live.

**Response (each step owner-approved, in order).**
1. **Paused the Vercel project.** Every hostname returned 503 and the leak stopped.
2. **Verified `main`.** Anonymous probes of every private route on a local prod build all returned 401/403/307. Public `GET /api/workouts` includes `notes`, which matches the PRD ("notes preview" is public).
3. **Deployed `main` to production.** Vercel blocks production builds while a project is paused, so it was unpaused for the ~2-minute build. The owner accepted that window, since the secret was already compromised and rotation follows.
4. **Re-checked on prod.** Both hostnames returned 401 on every private route, and `/`, `/about`, `/recap`, and the OG card returned 200.
5. **Re-enabled Deployment Protection** (Vercel Authentication, `all_except_custom_domains`). All generated deployment URLs, including the six v1 ones, now redirect to Vercel login.

**Still open (BLOCKED.md):** rotate the ingest secret (needs the owner's passkey, now possible because v2 is live), and check for data written during the window.

**Decisions / lessons.**
- **Keep Standard Protection on permanently.** That replaces N6's original "turn protection off". The public surface is the custom domain only, and generated URLs, which can serve stale builds, stay gated.
- **Rejected deleting the v1 deployments.** Protection closes them reversibly. Rolling back to v1 would reopen the leak anyway.
- **The deploy gap is the root cause, not a code bug.** v2's guards were correct but never shipped. Follow-ups: make deploys visible (a check that compares the prod deployment's commit with `main`, or Git-integrated deploys), and make every production smoke test include an anonymous probe of private routes (as N7 intended).

## 2026-10-10 — Production schema + migration ledger reconciled

**Context.** Applying Group R's migration showed prod's Drizzle ledger out of sync with the repo. The webauthn migration was recorded under its pre-renumbering timestamp (it had been `0002`), and `0002_modern_the_phantom` (the `daily_mood` table) had **never been applied**. Mood would have failed at the first owner login. A plain `pnpm db:migrate` would have re-run the webauthn migration and failed.

**Decision (owner-approved).** One transaction applied `0002` (CREATE TABLE `daily_mood`) and `0004` (ADD COLUMN `yearly_miles_goal`), inserted their ledger rows (sha256 of each file, as Drizzle does), and moved `0003`'s ledger timestamp to its journal value. A guard rolls the whole thing back unless exactly one `0003` row matches. Verified afterwards: the ledger matches the journal 5/5, and `pnpm db:migrate` is a no-op. Rejected: applying only `0004`, which would have left mood broken and the ledger booby-trapped for the next migration.

## 2026-10-24 — Deploy-drift visibility: public `/api/version` + manual check script (DRAFT, Evan to confirm)

**Context.** The 2026-10-10 incident's root cause was a deploy gap: prod ran a v1 build for months and nothing showed it. The follow-up asked for a way to compare the prod deployment's commit with `main`.

**Decisions.**
- **Embed the SHA at build time** in `next.config.ts` (`env.BUILD_COMMIT`): `git rev-parse HEAD` first, then `VERCEL_GIT_COMMIT_SHA`, else `"unknown"`. Values that aren't a hex SHA are rejected, so the endpoint can't echo junk. Rejected reading `VERCEL_GIT_COMMIT_SHA` at runtime: it only exists for Git-integrated deploys, and deploys here are CLI `vercel --prod`.
- **Public `GET /api/version` returns `{ commit }` only, with `Cache-Control: no-store`.** The SHA is already public on GitHub, so this leaks nothing. Rejected owner-gating it: the check has to work anonymously from a laptop or CI, without a passkey.
- **`scripts/check-deploy-drift.mjs <base-url>` compares that SHA with `git rev-parse origin/main`.** Exit 0 means in sync, 1 means drift, and 2 means it can't tell (unreachable, a pre-`/api/version` build, or no SHA). The logic lives in `src/lib/deploy-drift.mjs` with injectable fetch, so it's unit-tested. Run `git fetch origin` first.
- **Manual for now, not a scheduled CI job.** A scheduled job against prod is the next step, but it's a publishing/infra decision for Evan. Git-integrated deploys would remove the gap outright and are the stronger fix. Both are left to Evan.
- **Caveat:** a CLI deploy from a dirty or non-main checkout reports its local HEAD. Drift then shows up as a SHA mismatch, which is the point, but it can't flag uncommitted changes.

## 2026-10-31 — Cloudflare Access checked in-app with gatekeeper-ts (PLAT-AUTH-02) (DRAFT, Evan to confirm)

**Context.** Handed off from _system. A Cloudflare Access app already fronts `olympic.evanappel.me` on 9 paths, but the app trusted whatever reached it. Anyone who skipped Cloudflare (the `olympic-lime-six.vercel.app` origin) bypassed Access, leaving only the passkey session.

**Decisions.**
- **Pin `gatekeeper-ts` at `5dced3d`.** One shared `AccessVerifier` in `src/lib/access.ts`, built lazily from `CF_ACCESS_TEAM_DOMAIN` + `CF_ACCESS_AUD` (Vercel env only, never committed). A missing var throws, so the guarded paths fail closed (500) rather than open. `src/instrumentation.ts` runs `check()` at startup and logs a failure loudly. The server stays up so the public dashboard keeps serving.
- **`src/proxy.ts` 403s exactly the Access app's 9 paths** (`ACCESS_PATHS`), and every route handler under them checks Access again before the passkey check. A table-driven test fails if a handler on those paths is added without a case. `/api/health/ingest` is deliberately outside: the iPhone posts there with a Bearer token and no Cloudflare sign-in.
- **Workout and mood writes stay passkey-only (Evan's call).** The public dashboard (`/`, not behind Access) calls `POST /api/workouts`, `PATCH`/`DELETE /api/workouts/[id]` and `POST /api/mood`. Rejected moving them under Access: Access can't split by method, so `/api/workouts` would also lock the public `GET` list. That would mean new write paths, a new path list for _system, and handling an expired Access session in dashboard `fetch`es. Rejected a hybrid (mood + `[id]` under Access) for the same reasons at smaller scale. Trade-off: those writes have one layer (passkey), not two.
- **No local-dev bypass (Evan's call).** Without Cloudflare in front, the 9 paths 403 in `next dev` too, so owner features can't be clicked through locally. Rejected a `NODE_ENV === "development"` skip: it's an auth-bypass path that could be misconfigured.
- **Anonymous smoke table:** the 9 paths now expect 403 (was 401/307, and `/login` was public). The login endpoints, previously exempt, are now probed: the proxy refuses before any challenge row is written.
- **Not done:** Preview env vars (CLI 54 needs an interactive prompt). Preview `*.vercel.app` deploys never carry an Access token, so those paths fail closed there either way.
