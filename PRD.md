# Olympic — Workout Tracker PRD

**Owner:** Evan Appel
**Status:** Draft v1 — locked for build
**Last updated:** 2026-05-31

---

## 1. Problem

I walk on a treadmill at the gym and outdoors. Today, that data lives in two disconnected places: my head (treadmill speed/incline/duration) and Apple Health (passive steps, distance, outdoor walks). I have no long-term view of total movement, no way to see whether I'm trending up or down over months, and no single record I can look back on a year from now.

## 2. Goal

A single personal web app that:

1. Lets me log treadmill workouts in under 10 seconds from my phone at the gym.
2. Continuously ingests step/distance/calorie/outdoor-walk data from Apple Health.
3. Reconciles the two sources so totals aren't double-counted.
4. Visualizes everything on a long-term dashboard — daily, weekly, monthly, yearly.

## 3. Non-goals (v1)

- Multi-user. This is for me, with Vercel deployment protection.
- Workout types other than walking (no bike, elliptical, weights, runs).
- Interval workouts. Each treadmill session is one steady speed/incline.
- Heart rate, sleep, nutrition, or any non-movement health metric.
- Native iOS/Android apps. Web PWA only.
- Coaching, training plans, or social features.

## 4. Users

Single user: me. Logged in via Vercel deployment protection (existing Vercel Pro account). No in-app auth, no user_id columns.

## 5. Core flows

### 5.1 Log a treadmill workout (gym, iPhone Safari, one-handed)
1. Open PWA from home screen.
2. Tap **Log workout**.
3. Enter speed (mph), incline (%), minutes. Optional note.
4. Tap **Save** when stepping off the treadmill.
5. App computes distance, steps, calories from my saved weight & stride. `end_at = now`, `start_at = now − minutes`.

### 5.2 Initial Apple Health backfill (one-time, at launch)
1. iPhone Health app → Export All Health Data → AirDrop zip to laptop.
2. Web app → Settings → **Import Apple Health export**.
3. Upload zip. Background job parses XML, populates `daily_metric` and `workout` (outdoor walks) for the full history.

### 5.3 Ongoing Apple Health sync (nightly, set-and-forget)
1. "Health Auto Export" iOS app ($5, one-time setup) is configured with my ingest URL + secret.
2. Nightly, it POSTs JSON: yesterday's steps/distance/active-calories + any walking workouts.
3. `/api/health/ingest` upserts on `external_id` (idempotent — replays are safe).

### 5.4 View the dashboard
1. Open web app on laptop or phone.
2. See today's progress, current streak, week miles vs goal, YTD miles.
3. Scroll for daily-steps bar, weekly-miles trend line, yearly heatmap, pace/incline trends, recent workout list, PRs.

### 5.5 Edit a past workout
1. Workout list → tap a row → edit fields → save.
2. Any past workout can also be deleted.

### 5.6 Export everything
1. Settings → **Export CSV** → downloads all workouts + daily totals.

## 6. Functional requirements

### 6.1 Data model

```
settings (singleton row)
  weight_lb              numeric
  stride_in              numeric
  daily_step_goal        int
  weekly_miles_goal      numeric
  timezone               text       (e.g. "America/New_York")
  health_ingest_secret   text       (rotatable)

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
```

### 6.2 Dedup rule (read-time computation)

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

### 6.3 Calculations (treadmill entry)

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

### 6.4 Apple Health import

**Backfill (export.zip):**
- Endpoint: `POST /api/health/import` (multipart, zip upload)
- Parser extracts from `export.xml`:
  - `<Record type="HKQuantityTypeIdentifierStepCount">` → aggregate by local date → `daily_metric.steps`
  - `<Record type="HKQuantityTypeIdentifierDistanceWalkingRunning">` → aggregate by local date → `daily_metric.distance_mi`
  - `<Record type="HKQuantityTypeIdentifierActiveEnergyBurned">` → aggregate by local date → `daily_metric.active_calories`
  - `<Workout workoutActivityType="HKWorkoutActivityTypeWalking">` → insert as `workout` with `source='outdoor'`, `external_id = workout UUID`
- Idempotent: upsert on `daily_metric.date` and `workout.external_id`.
- Background-processed (long-running). Show progress in UI.

**Stream (Health Auto Export):**
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

### 6.5 Dashboard components

| Component | Description |
|---|---|
| **Today card** | Today's total steps, % of goal, distance, calories. |
| **Streak card** | Current consecutive days hitting `daily_step_goal`. Breaks on first miss. |
| **Week card** | Miles this week vs `weekly_miles_goal`. Resets Monday. |
| **YTD card** | Cumulative miles and workout count this calendar year. |
| **Daily steps bar** | Last 30 / 90 / 365 days toggle. Stacked: treadmill vs outdoor portion. Horizontal goal line. |
| **Weekly miles line** | Weekly totals + 4-week rolling average. Full history. |
| **Yearly heatmap** | GitHub-style 53×7 grid. Color intensity = steps. Hover = date + total. |
| **Pace & incline trends** | Two line charts of average speed and average incline of treadmill workouts, weekly buckets. |
| **Workout list** | Reverse-chronological, unified (treadmill + outdoor), with notes preview, edit, delete. |
| **PRs panel** | Longest walk (minutes), fastest avg speed, most steps/day, longest streak. Show "new PR" badge for 7 days after a record is set. |

### 6.6 Settings page

- Weight (lb), stride length (in)
- Daily step goal, weekly miles goal
- Timezone (defaults to browser's, overridable)
- Apple Health import (zip uploader)
- Health ingest URL + secret (regenerate button, copy button, paste-into-Health-Auto-Export instructions)
- Export all data as CSV
- Danger zone: delete all data

### 6.7 PWA requirements

- `manifest.json` with app name, icons, theme color, `display: standalone`
- Service worker that:
  - Caches app shell for offline view
  - Queues workout saves while offline; replays on reconnect
- Add-to-Home-Screen prompt on first visit from iOS Safari

## 7. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router (TypeScript) |
| UI | shadcn/ui + Tailwind CSS |
| Charts | shadcn charts (Recharts under the hood) + `react-activity-calendar` for heatmap |
| Database | Neon Postgres (via Vercel Marketplace) |
| ORM | Drizzle |
| Date math | `date-fns` + `date-fns-tz` |
| XML parsing (import) | `sax` (streaming, for large Apple Health exports) |
| Hosting | Vercel (Fluid Compute, Node.js 24) |
| Access control | Vercel deployment protection |
| Long-running import | Vercel Workflow (durable, crash-safe) |

## 8. Units & locale

- Imperial throughout: miles, mph, pounds, Fahrenheit.
- Day boundary: midnight local time (per `settings.timezone`).

## 9. Open items / v2 candidates

- Weight change tracking over time (today: single mutable value; v2: date-stamped log, possibly auto-imported from Apple Health if user logs weight there)
- Interval workouts (parent + segments schema)
- Heart rate ingestion (already in Apple Health export, just need fields)
- Goal history (today: mutable singleton; v2: track when goals changed)
- Sharing a read-only dashboard URL with family
- Apple Watch dedicated workouts (vs phone-only walking)

## 10. Success criteria

- I log every treadmill workout for 30 consecutive days without it feeling like friction.
- Daily-steps chart matches Apple Health's own daily totals within ±2% on days without treadmill workouts.
- On days with treadmill workouts, totals don't double-count: subtract treadmill workout from the same-day phone total when computing displayed values.
- A year from now, I can open the heatmap and see a continuous record.
