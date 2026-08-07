# Olympic — Workout Tracker PRD

**Owner:** Evan Appel
**Status:** Draft v2 — adds public/recruiter surface + single-user auth
**Last updated:** 2026-06-28

> **v2 scope note.** v1 was a fully private, single-user app behind Vercel deployment
> protection. v2 keeps the private phone-logging experience intact but splits the app into a
> **public read-only face** (a polished, real, living dashboard plus an engineering case study)
> that a recruiter can open from a resume/LinkedIn link with zero login friction, and a
> **private write side** (logging, settings, import, export) gated by a single-user passkey.
> The product is simultaneously (a) the tool Evan uses daily and (b) a portfolio piece.

---

## 1. Problem

I walk on a treadmill at the gym and outdoors. Today, that data lives in two disconnected places: my head (treadmill speed/incline/duration) and Apple Health (passive steps, distance, outdoor walks). I have no long-term view of total movement, no way to see whether I'm trending up or down over months, and no single record I can look back on a year from now.

Separately, I need a public artifact that demonstrates to recruiters that I can design and ship a real, well-engineered full-stack product — not a toy. The same app should serve both needs: it must stay a frictionless daily-use tool for me *and* present a credible, polished public face that a hiring manager can evaluate in two minutes without an account.

## 2. Goal

A single personal web app that:

1. Lets me log treadmill workouts in under 10 seconds from my phone at the gym.
2. Continuously ingests step/distance/calorie/outdoor-walk data from Apple Health.
3. Reconciles the two sources so totals aren't double-counted.
4. Visualizes everything on a long-term dashboard — daily, weekly, monthly, yearly.
5. **Doubles as a recruiter-facing portfolio piece:** a public, read-only, real-data dashboard plus an `/about` engineering case study, fronted by my name and links (GitHub, LinkedIn, resume, personal site), reachable with no login.

## 3. Non-goals (v1/v2)

- **Multi-user write.** Still exactly one author (me). v2 adds an *anonymous public reader* audience, but there is no sign-up, no second account, no `user_id` columns. "Public" = read-only and unauthenticated; "owner" = me, via passkey.
- Workout types other than walking (no bike, elliptical, weights, runs).
- Interval workouts. Each treadmill session is one steady speed/incline.
- Heart rate, sleep, nutrition, or any non-movement health metric.
- Native iOS/Android apps. Web PWA only.
- Coaching, training plans, or social features.
- Public *write* of any kind (no public comments, reactions, or guest logging).

## 4. Audiences

The app now serves two distinct audiences from one deployment:

| Audience | Who | Auth | Can do | Cannot do |
|---|---|---|---|---|
| **Owner** | Me | Passkey (WebAuthn) → session cookie | Log/edit/delete workouts, change settings, import Apple Health export, rotate ingest secret, export CSV, view everything | — |
| **Public reader** | Recruiters, anyone with the link | None (anonymous) | View the live dashboard with my real fitness data, read the `/about` case study, install the PWA | Write anything, see the ingest secret, reach Settings, import/export, or hit any owner-only endpoint |

The public reader sees **my real fitness data, nothing fuzzed** (steps, distance, calories, weight-derived numbers, heatmap, streaks, PRs) — that authenticity is intentional. The *only* thing never exposed publicly is the **`health_ingest_secret`** (a credential, not data) and any owner-only mutation surface.

## 5. Core flows

### 5.1 Log a treadmill workout (gym, iPhone Safari, one-handed) — owner
1. Open PWA from home screen.
2. If the session has expired, authenticate with the passkey (Face ID) — one tap.
3. Tap **Log workout**.
4. Enter speed (mph), incline (%), minutes. Optional note.
5. Tap **Save** when stepping off the treadmill.
6. App computes distance, steps, calories from my saved weight & stride. `end_at = now`, `start_at = now − minutes`.

### 5.2 Initial Apple Health backfill (one-time, at launch) — owner
1. iPhone Health app → Export All Health Data → AirDrop zip to laptop.
2. Web app → Settings → **Import Apple Health export**.
3. Upload zip. Background job parses XML, populates `daily_metric` and `workout` (outdoor walks) for the full history.

### 5.3 Ongoing Apple Health sync (nightly, set-and-forget) — machine-to-machine
1. "Health Auto Export" iOS app ($5, one-time setup) is configured with my ingest URL + secret.
2. Nightly, it POSTs JSON: yesterday's steps/distance/active-calories + any walking workouts.
3. `/api/health/ingest` validates the bearer secret and upserts on `external_id` (idempotent — replays are safe). This endpoint is **not** behind the passkey session; it is a server-to-server channel authenticated solely by the bearer secret.

### 5.4 View the dashboard — public or owner
1. Open the app on laptop or phone (no login required for read).
2. See today's progress, current streak, week miles vs goal, YTD miles.
3. Scroll for daily-steps bar, weekly-miles trend line, yearly heatmap, pace/incline trends, recent workout list, PRs.
4. Owner sees identical charts plus inline edit/delete affordances and a path to Settings; public sees a clean read-only view.

### 5.5 Recruiter visit (public, no login) — NEW
1. Recruiter clicks the link on my resume/LinkedIn → lands on `/` (the live dashboard).
2. Persistent header shows **"Evan Appel"** + links: GitHub (repo), LinkedIn, Resume (PDF), personal site, email. No login button is visible.
3. They browse real charts, then click **About this build** → `/about` case study (architecture diagram, decision log, stack + live metrics, short personal narrative).
4. At no point do they hit an auth wall, an empty state, or a "request access" screen.

### 5.6 Owner login (hidden) — NEW
1. I navigate directly to `/login` (no link advertises it; I reach it by typed URL or a home-screen shortcut).
2. Passkey challenge → Face ID → signed, httpOnly session cookie set.
3. Redirect to the dashboard, now in owner mode (write affordances visible).
4. Session persists long enough for daily gym use; re-auth is one Face ID tap.

### 5.7 Edit a past workout — owner
1. Workout list → tap a row → edit fields → save.
2. Any past workout can also be deleted.

### 5.8 Export everything — owner
1. Settings → **Export CSV** → downloads all workouts + daily totals.

## 6. Public vs private surface (access map)

Deployment protection is all-or-nothing, so v2 **replaces it with route-level access control**: the app is publicly deployed (no Vercel SSO gate) and each route/endpoint enforces its own access. The default for any *mutation* or *secret-bearing* route is owner-only; the default for *read aggregates* is public.

| Route / endpoint | Method | Access | Notes |
|---|---|---|---|
| `/` (dashboard) | GET | **Public** | Read-only render; owner mode adds write affordances when session present. |
| `/about` | GET | **Public** | Case study. |
| `/api/dashboard/*` (aggregates, workouts list, daily metrics, PRs, heatmap) | GET | **Public** | Serializers MUST whitelist fields; never include `health_ingest_secret` or settings credentials. |
| `/login`, `/register` | GET/POST | **Public route, owner outcome** | Reachable but only my passkey succeeds. `/login` is unadvertised. |
| `/app/*` write UI (log, edit, delete, settings) | GET | **Owner** | Redirect to `/login` if no session. |
| `/api/workout` | POST/PUT/DELETE | **Owner** | Session required. |
| `/api/settings` | GET/POST | **Owner** | Returns/accepts the ingest secret → must never be public. |
| `/api/health/import` | POST | **Owner** | Zip upload. |
| `/api/health/ingest` | POST | **Bearer secret** | Machine-to-machine; not session-gated. |
| `/api/export` (CSV) | GET | **Owner** | Full data dump. |
| `/manifest.json`, service worker, icons | GET | **Public** | PWA install works for anyone. |

**Enforcement requirements:**
- A single server-side `requireOwner()` guard wraps every owner-only route handler; missing/invalid session → `401`/redirect.
- Public read endpoints use explicit field whitelists (DTOs), not "serialize the whole row," so a future sensitive column can't silently leak.
- The owner session and the `health_ingest_secret` are independent credentials — compromise of one does not grant the other.

## 7. Authentication (single-user passkey)

### 7.1 Mechanism
- **WebAuthn / passkeys** via `@simplewebauthn/server` (verification) + `@simplewebauthn/browser` (ceremonies).
- On success, mint a **signed, httpOnly, `SameSite=Lax`, `Secure` session cookie** (e.g. `iron-session` or a `jose`-signed JWT). No server-side session table required (stateless cookie); credential records live in Postgres.
- One human (me), but **multiple registered credentials allowed** (iPhone Face ID + laptop Touch ID), so I'm not locked out if one device dies.

### 7.2 Bootstrap / registration (the chicken-and-egg)
Since the app is public, `/register` cannot be openly callable. Registration is permitted only when **both**:
1. The request carries a one-time `BOOTSTRAP_REGISTRATION_SECRET` (env var), **and**
2. Either zero credentials exist yet (first device), **or** a valid owner session is present (adding a subsequent device).

After the first credential is registered, the bootstrap secret can be rotated/removed. Adding a second device later is done while already logged in.

### 7.3 Relying-party config
- `rpID` = production domain; `origin` pinned to the deployed HTTPS origin.
- Require `userVerification: 'preferred'` (Face ID/Touch ID).
- Store and verify the signature counter to detect cloned authenticators.
- Registration/authentication challenges are short-lived (≤5 min) and single-use.

## 8. Recruiter-facing surface

### 8.1 Header identity (persistent, all public pages)
- Display name: **Evan Appel**, with a one-line tagline (e.g. "Full-stack engineer — this is a tool I built and use daily").
- Links (sourced from `~/Documents/career`):
  - **GitHub repo** (prominent — see §12): `https://github.com/EvanWAppel/olympic` (already public)
  - **LinkedIn:** `https://www.linkedin.com/in/evan-appel-8885569b/`
  - **Resume (PDF):** serve from `/public/resume.pdf` — copy from `~/Documents/career/resumes/resume_ai_engineer.pdf` (best-fit variant for this engineering framing)
  - **Personal site:** repo `https://github.com/EvanWAppel/enki`; **deployed URL still TBD** (not recorded in the career repo — confirm the live domain)
  - **Email:** `mailto:appelew@gmail.com`
- A clear **"About this build"** link to `/about`.
- No login button (login is hidden per §5.6).

### 8.2 `/about` case study page — contents
1. **Short personal narrative** — a few sentences on why I built it (two-source movement tracking) and what I learned.
2. **Architecture + data-flow diagram** — Apple Health (backfill zip + nightly Health Auto Export) → `/api/health/*` ingest → Postgres (`daily_metric`, `workout`) → read-time dedup/reconciliation → dashboard. Explain the reconciliation rule (§9.2) in plain language.
3. **Decision log / tradeoffs** — why Neon Postgres, why *read-time* dedup vs. precomputed totals, why passkeys over passwords, why single-user (no multi-tenant complexity), why route-level access control replaced deployment protection, why a PWA over native.
4. **Tech stack + live metrics** — the stack table, plus real, queried-at-render numbers: total workouts logged, days of continuous data, current streak, Lighthouse score, test count. These should be **live** (pulled from the DB / build), not hardcoded, so the page proves the system is real and maintained.

### 8.3 Tone
Honest and specific over salesy. The dashboard and code are the proof; `/about` is the annotation.

## 9. Functional requirements

### 9.1 Data model

```
settings (singleton row)
  weight_lb              numeric
  stride_in              numeric
  daily_step_goal        int
  weekly_miles_goal      numeric
  timezone               text       (e.g. "America/New_York")
  health_ingest_secret   text       (rotatable; OWNER-ONLY, never serialized to public)

workout
  id                     uuid pk
  source                 enum('treadmill', 'outdoor')
  start_at               timestamptz
  end_at                 timestamptz
  minutes                numeric
  speed_mph              numeric    nullable (treadmill only)
  incline_pct            numeric    nullable (treadmill only)
  distance_mi            numeric
  steps                  int
  calories               numeric
  notes                  text       nullable
  external_id            text       nullable, unique  (Apple Health UUID for idempotent reimports)
  created_at             timestamptz
  updated_at             timestamptz

daily_metric
  date                   date pk    (local date per settings.timezone)
  steps                  int        (phone-reported)
  distance_mi            numeric    (phone-reported)
  active_calories        numeric    (phone-reported)
  updated_at             timestamptz

-- NEW (v2): passkey credentials. One human, possibly several devices.
webauthn_credential
  id                     text pk    (credential ID, base64url)
  public_key             bytea
  counter                bigint
  transports             text[]     nullable
  device_label           text       nullable  (e.g. "iPhone", "MacBook")
  created_at             timestamptz
  last_used_at           timestamptz nullable

-- NEW (v2): short-lived WebAuthn ceremony challenges.
webauthn_challenge
  challenge              text pk
  type                   enum('registration','authentication')
  expires_at             timestamptz  (≤ 5 min; single-use, deleted on consume)
```

> Sessions are **stateless** (signed cookie), so no `session` table. If a server-side revocation
> list is ever needed, add one in v3.

### 9.2 Dedup rule (read-time computation)

For any date D, displayed totals are computed as:

```
phone_totals(D)              = daily_metric where date = D
treadmill_workouts_on(D)     = workout where source='treadmill' and start_at::date = D
treadmill_totals(D)          = sum(steps, distance_mi, calories) over treadmill_workouts_on(D)

# Subtract the portion of phone data that overlaps with treadmill windows.
# Approximation: assume phone steps for a treadmill window are proportional to window length / total non-sleep hours.
# For v1, use a simpler heuristic: if a treadmill workout exists on D, replace phone steps/distance/calories
# during workout windows by subtracting the treadmill workout's own computed values from phone totals.

displayed_steps(D)     = max(0, phone_totals.steps     - treadmill_totals.steps)     + treadmill_totals.steps
displayed_distance(D)  = max(0, phone_totals.distance  - treadmill_totals.distance)  + treadmill_totals.distance
displayed_calories(D)  = max(0, phone_totals.calories  - treadmill_totals.calories)  + treadmill_totals.calories
```

Outdoor workouts from Apple Health are NOT subtracted — their steps/distance are already part of the phone's daily totals, so they're surfaced for the workout list but don't double-count.

### 9.3 Calculations (treadmill entry)

Given saved `weight_lb` and `stride_in`, and entered `speed_mph`, `incline_pct`, `minutes`:

```
hours          = minutes / 60
distance_mi    = speed_mph × hours
steps_per_mile = 63360 / stride_in
steps          = round(distance_mi × steps_per_mile)

# MET formula for walking with incline (ACSM):
# VO2 (ml/kg/min) = 3.5 + 0.1 × (speed_m_per_min) + 1.8 × (speed_m_per_min) × grade
speed_m_per_min = speed_mph × 26.8224
grade           = incline_pct / 100
vo2             = 3.5 + 0.1 × speed_m_per_min + 1.8 × speed_m_per_min × grade
met             = vo2 / 3.5
weight_kg       = weight_lb × 0.453592
calories        = met × weight_kg × hours
```

Calculations run client-side at save time and are stored as columns (no live recompute on settings change — past workouts keep their original numbers).

### 9.4 Apple Health import

**Backfill (export.zip):** — owner-only
- Endpoint: `POST /api/health/import` (multipart, zip upload). Requires owner session.
- Parser extracts from `export.xml`:
  - `<Record type="HKQuantityTypeIdentifierStepCount">` → aggregate by local date → `daily_metric.steps`
  - `<Record type="HKQuantityTypeIdentifierDistanceWalkingRunning">` → aggregate by local date → `daily_metric.distance_mi`
  - `<Record type="HKQuantityTypeIdentifierActiveEnergyBurned">` → aggregate by local date → `daily_metric.active_calories`
  - `<Workout workoutActivityType="HKWorkoutActivityTypeWalking">` → insert as `workout` with `source='outdoor'`, `external_id = workout UUID`
- Idempotent: upsert on `daily_metric.date` and `workout.external_id`.
- Background-processed (long-running). Show progress in UI.

**Stream (Health Auto Export):** — bearer-secret only
- Endpoint: `POST /api/health/ingest`, requires `Authorization: Bearer <settings.health_ingest_secret>`.
- Body shape (configured in Health Auto Export to send):
  ```json
  {
    "metrics": [
      {"name": "step_count",      "units": "count", "data": [{"date": "2026-05-31", "qty": 8432}]},
      {"name": "walking_running_distance", "units": "mi", "data": [...]},
      {"name": "active_energy",   "units": "kcal", "data": [...]}
    ],
    "workouts": [
      {"id": "uuid", "name": "Walking", "start": "...", "end": "...",
       "distance": {...}, "activeEnergyBurned": {...}, "steps": {...}}
    ]
  }
  ```
- Upsert daily_metrics, upsert workouts on `external_id`.

### 9.5 Dashboard components

| Component | Description | Visibility |
|---|---|---|
| **Today card** | Today's total steps, % of goal, distance, calories. | Public |
| **Streak card** | Current consecutive days hitting `daily_step_goal`. Breaks on first miss. | Public |
| **Week card** | Miles this week vs `weekly_miles_goal`. Resets Monday. | Public |
| **YTD card** | Cumulative miles and workout count this calendar year. | Public |
| **Daily steps bar** | Last 30 / 90 / 365 days toggle. Stacked: treadmill vs outdoor portion. Horizontal goal line. | Public |
| **Weekly miles line** | Weekly totals + 4-week rolling average. Full history. | Public |
| **Yearly heatmap** | GitHub-style 53×7 grid. Color intensity = steps. Hover = date + total. | Public |
| **Pace & incline trends** | Two line charts of average speed and average incline of treadmill workouts, weekly buckets. | Public |
| **Workout list** | Reverse-chronological, unified (treadmill + outdoor), with notes preview. Edit/delete controls only in owner mode. | Public (read); edit/delete owner-only |
| **PRs panel** | Longest walk (minutes), fastest avg speed, most steps/day, longest streak. "new PR" badge for 7 days after a record is set. | Public |

### 9.6 Settings page — owner-only

- Weight (lb), stride length (in)
- Daily step goal, weekly miles goal
- Timezone (defaults to browser's, overridable)
- Apple Health import (zip uploader)
- Health ingest URL + secret (regenerate button, copy button, paste-into-Health-Auto-Export instructions)
- **Manage passkeys** (NEW): list registered credentials with device label + last-used; register a new device; revoke one.
- Export all data as CSV
- Danger zone: delete all data

The entire Settings surface (page + `GET/POST /api/settings`) is behind `requireOwner()` because it exposes the ingest secret.

### 9.7 PWA requirements

- `manifest.json` with app name, icons, theme color, `display: standalone`
- Service worker that:
  - Caches app shell for offline view (public dashboard shell included)
  - Queues workout saves while offline; replays on reconnect (owner only)
- Add-to-Home-Screen prompt on first visit from iOS Safari
- The owner's home-screen install may deep-link to `/login`; the public install lands on `/`.

## 10. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router (TypeScript) |
| UI | shadcn/ui + Tailwind CSS |
| Charts | shadcn charts (Recharts under the hood) + `react-activity-calendar` for heatmap |
| Database | Neon Postgres (via Vercel Marketplace) |
| ORM | Drizzle |
| Auth | WebAuthn passkeys via `@simplewebauthn/server` + `@simplewebauthn/browser`; signed httpOnly session cookie (`iron-session` or `jose`) |
| Access control | Route-level `requireOwner()` guard (replaces Vercel deployment protection) + bearer secret for ingest |
| Date math | `date-fns` + `date-fns-tz` |
| XML parsing (import) | `sax` (streaming, for large Apple Health exports) |
| Hosting | Vercel (Fluid Compute, Node.js 24) — **publicly deployed** (no SSO gate) |
| Long-running import | Vercel Workflow (durable, crash-safe) |

## 11. Units & locale

- Imperial throughout: miles, mph, pounds, Fahrenheit.
- Day boundary: midnight local time (per `settings.timezone`).

## 12. Security & going-public checklist

Flipping from "private behind deployment protection" to "publicly deployed" and making the repo public introduces new exposure. Gate the public launch on all of:

- [ ] **Remove Vercel deployment protection** only after route-level `requireOwner()` is in place and tested on every owner-only route.
- [ ] **First passkey registered** and a successful login verified before protection is removed (don't lock yourself out).
- [ ] **Audit git history for secrets** before making the repo public: `health_ingest_secret`, `DATABASE_URL`, `BOOTSTRAP_REGISTRATION_SECRET`, session signing key, any `.env`. Scrub history (e.g. `git filter-repo`) if found; rotate anything that ever landed in a commit.
- [ ] **Public read DTOs whitelist fields** — verified that no public endpoint serializes `settings.health_ingest_secret` or other credentials.
- [ ] **Rate-limit** `/api/health/ingest`, `/login`, and `/register` (Vercel Firewall / WAF rules) to blunt brute-force and abuse.
- [ ] **Bearer secret rotated** to a fresh value after history scrub; Health Auto Export reconfigured.
- [ ] **`robots`/SEO posture decided** — is the dashboard indexable? (Default: allow `/` and `/about`, disallow `/app`, `/login`.)
- [ ] **Resume PDF** placed in `/public/resume.pdf` (or hosted elsewhere) and the header link points to it.
- [ ] Confirm the public dashboard has **no empty/broken states** (data is continuous) before sharing the link.

## 13. Open items / v2+ candidates

- **Resume hosting:** copy `~/Documents/career/resumes/resume_ai_engineer.pdf` → `/public/resume.pdf` (4 variants exist: `resume_ai_engineer`, `resume_solutions_engineer`, `resume_analytics_engineer`, `resume_data_analyst` — confirm which one(s) to use, or which best matches the roles you're targeting with this link).
- **Personal site deployed URL:** the `enki` repo is the source, but no live domain is recorded in `~/Documents/career` — confirm the deployed URL (or link the repo until the site has a stable domain).
- **Resolved from career repo:** GitHub `https://github.com/EvanWAppel/olympic`, LinkedIn `https://www.linkedin.com/in/evan-appel-8885569b/`, email `appelew@gmail.com`.
- **Cross-check (career portfolio audit, 2026-06-24):** that audit independently flagged Olympic's `GET /api/health/secret` returning the ingest secret with no auth check, and that the repo still ships a default `create-next-app` README — both must be resolved before the public deploy (covered by §12; README is a launch-polish item).
- **Live `/about` metrics source:** decide query/build hooks for total workouts, days of data, Lighthouse score, test count.
- Weight change tracking over time (today: single mutable value; v2: date-stamped log, possibly auto-imported from Apple Health).
- Interval workouts (parent + segments schema).
- Heart rate ingestion (already in Apple Health export, just need fields).
- Goal history (today: mutable singleton; v2: track when goals changed).
- Sharing a *scoped* read-only dashboard URL with family (distinct from the now-public main dashboard).
- Apple Watch dedicated workouts (vs phone-only walking).
- Session revocation list (if stateless cookie ever proves insufficient).

## 14. Success criteria

**Owner (daily use):**
- I log every treadmill workout for 30 consecutive days without it feeling like friction; passkey re-auth is one Face ID tap and never blocks a save.
- Daily-steps chart matches Apple Health's own daily totals within ±2% on days without treadmill workouts.
- On days with treadmill workouts, totals don't double-count (treadmill subtracted from same-day phone total per §9.2).
- A year from now, I can open the heatmap and see a continuous record.

**Recruiter (portfolio):**
- A recruiter opens the resume/LinkedIn link and reaches a polished, real-data dashboard **with no login, no empty state, and no access wall**.
- From the header they can reach my GitHub, LinkedIn, resume, and the `/about` case study within one click each.
- `/about` communicates the architecture, key decisions, and live metrics clearly enough that an engineer can judge the work without reading the code — and the public repo is there if they want to.
- No private surface (Settings, ingest secret, write endpoints) is reachable or discoverable by a public visitor.
