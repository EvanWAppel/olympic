# Olympic — session primer

## Next session — 2026-10-24 weekend

**Goal.** Olympic is a long-term walking journal that merges hand-logged treadmill sessions with
Apple Health data into one dashboard. The same deploy is a public, read-only portfolio piece
(`olympic.evanappel.me`) and a passkey-gated owner tool.

**Current state (main @ cc1cf41, 2026-10-23).**
- Phases 0–5 are shipped and v2 is live in prod. Phase 6 is done for O, P2/P3, Q, R and S3.
- The weekend run merged as **PR #31**: ledger sync (K16/N1 done, N7 anonymous half), lint
  warnings cleared, WCAG AA contrast test + token fix, build-time git SHA + `GET /api/version` +
  `scripts/check-deploy-drift.mjs`, `scripts/smoke-anon.mjs`, the S1 code half (`<Analytics />`),
  and the README test-count refresh. Dependabot #11 (TypeScript 6) and #14 (@types/node 26) have
  since merged too.
- Open work: P1 (`[~]`), S1 (`[~]`, dashboard half is Evan's), S2, N2/N4/N6 (`[~]`)/N7 (`[~]`)/N8,
  and Group T, which is blocked.
- Suite: **363 tests** per the README badge and `acb9357` (PR #31); not re-run for this refresh.
  CI on main is green (run for `cc1cf41`).
- Open PRs: dependabot #12, #13, #15 and #32 (react + react-dom + types to 19.3; it supersedes
  #12). Merge decisions are Evan's; don't redo them.

### Tasks you can do alone

None queued. All seven weekend tasks merged in PR #31. Everything left in `TASKS.md` is Evan's
(N2, N4, N8, the N7 owner half, the S1 dashboard switch, the P1 Lighthouse re-run) or needs the
personal-key guardrail first (S2, and Group T, whose checklist is in `BLOCKED.md`). Check `TASKS.md` and `BLOCKED.md`
and ask Evan before starting anything new.

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
- **Dependency PRs #12, #13, #15, #32**: merge decisions are Evan's.
- **Prod DB**: running migrations or any query against it (`pnpm db:migrate`/`db:push` with a
  real `DATABASE_URL`).
- **Encrypted paths**: none (no `.gitattributes`).
