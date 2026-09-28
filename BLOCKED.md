# BLOCKED — what I need from Evan

- [ ] 🟡 **AI-insights feature (Group T / PRD §15.4) — personal-API-key guardrail.** Blocks all of Group T; the rest of Phase 6 proceeds without it. Before any LLM key is wired into this **public, unauthenticated** app, confirm all four (owner action):
  1. **Isolated workspace** — create a *dedicated* Vercel AI Gateway workspace/project for Olympic (not your personal/default one). Vercel dashboard → AI Gateway → new project.
  2. **Scoped key** — mint a key inside that workspace, used only by this app; drop it into Vercel env as (e.g.) `AI_GATEWAY_API_KEY` for the Olympic project only.
  3. **Hard spend cap + alert** — set a spend/usage limit + alert on that workspace/key that cannot be bypassed client-side (a low ceiling, e.g. $10/mo, is fine — this is a public demo).
  4. **Explicit confirmation** — confirm here that the key is NOT your personal/default key.

  Unblock by checking this box (or deleting the line) once 1–4 are done and the env var is set on the Olympic Vercel project. Why it's gated: a public app on a personal, uncapped key lets anyone on the internet spend against your account (the Tiresias/Elvis incident). Rate limiting on the endpoint (ties to N4) is also required before public exposure, but that's my work, not yours.
