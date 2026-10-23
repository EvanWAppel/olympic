# Olympic — session primer

## Next session — 2026-10-24 weekend

**Goal.** Olympic is a long-term walking journal that merges hand-logged treadmill sessions with
Apple Health data into one dashboard. The same deploy is a public, read-only portfolio piece
(`olympic.evanappel.me`) and a passkey-gated owner tool.

**Current state (main @ 8b2c341).**
- Phases 0–5 are shipped and v2 is live in prod. Phase 6 is done for O, P2/P3, Q, R and S3.
- Open work: P1 (`[~]`), S1, S2, N2/N4/N7/N8, and Group T, which is blocked.
- Suite on main: **293/293 passing** (61 files), typecheck clean, lint 0 errors and 2 warnings.
  CI on main is green.
- **Unpushed local work:** Evan's checkout (`~/Documents/portfolio/olympic`) is on
  `chore/n-phase-progress`. That branch has a docs-only commit, `6548d07`, that main lacks. It
  marks K16 done (passkey works, 2026-10-11), N1 done (history audit clean), and the anonymous
  half of N7 passing. It also moves the passkey blocker to resolved. There is no PR for it.
- Open PRs: dependabot only (#11–#15). Don't redo them.

**Work branch:** `weekend-2026-10-24`, in a worktree. Never touch Evan's checkout. Open one PR
per task at the end, and don't merge.

### Tasks you can do alone (in order)

1. **Ledger sync.** Cherry-pick `6548d07` from the shared object store
   (`git cherry-pick 6548d07`). Then make TASKS.md and BLOCKED.md agree with it.
   *Done:* K16 and N1 are `[x]`, N7 is `[~]`, and BLOCKED.md shows the passkey item as resolved.
   *Test:* none (docs only).
2. **Lint warnings → 0.** Fix the two unused-var warnings in
   `src/app/api/workouts/__tests__/route.test.ts:91` and
   `src/components/__tests__/health-import-card.test.tsx:5`.
   *Done:* `pnpm lint` reports 0 problems and the suite is still green.
3. **a11y colour-contrast fix (P3 note: a11y fell 100 → 96 after the editorial redesign).**
   - TDD first: write a test that parses the light and dark tokens in `src/app/globals.css` and
     asserts that every text/background pair the UI uses meets WCAG AA (≥4.5:1, or ≥3:1 for
     large text). Use the WCAG relative-luminance formula.
   - Then adjust the failing tokens, keeping the editorial palette's look.
   - *Done:* the new test passes. Note in TASKS.md that the Lighthouse a11y re-check is Evan's.
4. **Deploy-drift visibility (DECISIONS 2026-10-10 follow-up).**
   - Embed the build's git SHA at build time, e.g. via `next.config.ts` env from
     `git rev-parse HEAD`, falling back to `VERCEL_GIT_COMMIT_SHA`.
   - Expose it on a public `GET /api/version` that returns `{ commit }` and nothing secret.
   - Add `scripts/check-deploy-drift.mjs <base-url>`, which compares that SHA with
     `git rev-parse origin/main`.
   - TDD the route and the compare logic, with fetch mocked.
   - *Done:* the tests pass, `curl localhost:3000/api/version` works on a local `pnpm build && pnpm start`,
     and a DECISIONS.md entry is drafted.
5. **Anonymous smoke probe (N7 automation).**
   - Write `scripts/smoke-anon.mjs <base-url>`. It holds a table of public routes (expect 200)
     and private routes (expect 401/403/307), exits non-zero on any mismatch, and covers every
     route DECISIONS lists.
   - Keep the route table in a `src/lib/` module and unit-test it.
   - Run it against a local prod build only.
   - *Done:* tests are green and the local run passes. Document it in the README.
6. **S1 Vercel Analytics (code half).**
   - Add `@vercel/analytics` (`pnpm add`) and render `<Analytics />` in `src/app/layout.tsx`.
   - Write a component test that layout includes it.
   - *Done:* green suite, `pnpm build` passes, and BLOCKED.md has a 🟡 for "enable Web Analytics
     in the Vercel dashboard + deploy".
7. **README/docs refresh.**
   - The test badge and "215 tests" are stale. Use `pnpm count-tests` (the true count is now 293).
   - Add a changelog entry to `src/lib/changelog.ts` for Group R goals if v3's entry doesn't
     already list it, and keep the invariant tests green.
   - *Done:* suite green.

Each code task: write the test first, watch it fail, then implement. Before each PR, run
typecheck, lint and the full suite.

### Test command

Docker must be running (`open -a Docker`). The full suite needs the local Postgres + Neon proxy
stack. **Run it under `bash -c`**, because zsh won't word-split a `$cmd` string and the
migrations silently won't apply.

```bash
bash -c '
export COMPOSE_PROJECT_NAME=olympicwk
docker compose -f docker-compose.test.yml up -d --wait
psq() { docker compose -f docker-compose.test.yml exec -T postgres psql -U postgres -d main -v ON_ERROR_STOP=1 "$@"; }
psq -c "CREATE EXTENSION IF NOT EXISTS pgcrypto"
for f in drizzle/*.sql; do psq < "$f" >/dev/null; done
DATABASE_URL=postgres://postgres:postgres@localhost:5432/main \
NEON_LOCAL_PROXY_URL=http://localhost:4444/sql \
BOOTSTRAP_REGISTRATION_SECRET=ci-bootstrap-secret-not-real \
SESSION_SECRET=ci-session-secret-not-real-0123456789abcdef \
  pnpm test:run
docker compose -f docker-compose.test.yml down -v'
pnpm typecheck && pnpm lint
```

- The full run takes about 9 minutes locally. For a quick loop, run `pnpm vitest run <path>`
  with the same env.
- The dummy secrets are the CI values. **Never read `.env.local`.**

### House rules (portfolio CLAUDE.md, ROCRLL)

- TDD-first, with a test task before each implementation task.
- If a test is hard to write, stop. Hard tests mean the design is wrong.
- Record every decision with a real trade-off in DECISIONS.md, drafted by you for Evan to confirm.
- Anything only Evan can do goes in BLOCKED.md, in canonical format.
- Never push to main and never merge.
- Don't look at raw personal data. Seed synthetic data for local checks.
- No self-feeding loops. If anything is unclear, stop and ask (record it in BLOCKED.md).
- Verify with curl, logs and tests. **No browser automation.**

### Do NOT do

- **Deploy anything** (`vercel`, `vercel --prod`, env changes, project pause/unpause, firewall
  edits). Production deploys are Evan's.
- **N2** (rotate the ingest secret), the **N7 owner half**, **N8** (tag `v2.0-public`), and
  retiring `BOOTSTRAP_REGISTRATION_SECRET` all need Evan's passkey, phone or Vercel.
- **N4**: WAF rate limits are Vercel dashboard config on prod (see BLOCKED.md).
- **S2** (Sentry or similar): a third-party key. It must clear the personal-key guardrail first.
- **Group T** (AI insights): blocked on the four-point key checklist in BLOCKED.md.
- **P1 / a11y Lighthouse re-runs and the README screenshot.** These need a browser. Ask Evan;
  don't use it unasked.
- **Dependabot PRs #11–#15**: merge decisions are Evan's. TS 6 and @types/node 26 are majors.
- **Prod DB**: running migrations or any query against it (`pnpm db:migrate`/`db:push` with a
  real `DATABASE_URL`).
- **Encrypted paths**: none (no `.gitattributes`).
