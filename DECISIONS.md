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
