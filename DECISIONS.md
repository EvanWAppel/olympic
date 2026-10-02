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
- **Defer the below-the-fold WorkoutList** like the charts (TBT help, CLS stayed 0).
- **Stopped at ~83 rather than chasing the last points with risky caching.** The local simulation is pessimistic (observed LCP 2.8 s); the real CDN-backed deploy should score higher, so the ≥ 90 confirmation belongs on prod. Deeper caching stays an option if prod falls short.
