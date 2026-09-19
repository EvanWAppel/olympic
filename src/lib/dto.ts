/**
 * Public-facing serializers (PRD §6). Anything reachable without an owner
 * session MUST go through an explicit field whitelist here rather than
 * serializing a whole DB row, so a future sensitive column can never silently
 * leak. In particular, `settings.health_ingest_secret` is a credential and is
 * never exposed publicly.
 */

/** Fields safe to expose for a workout in the public dashboard / list. */
export interface PublicWorkout {
  id: string
  source: "treadmill" | "outdoor"
  startAt: string
  endAt: string
  minutes: string
  speedMph: string | null
  inclinePct: string | null
  distanceMi: string
  steps: number | null
  calories: string | null
  notes: string | null
  externalId: string | null
  createdAt: string
  updatedAt: string
}

type WorkoutRow = {
  id: string
  source: "treadmill" | "outdoor"
  startAt: Date | string
  endAt: Date | string
  minutes: string
  speedMph: string | null
  inclinePct: string | null
  distanceMi: string
  steps: number | null
  calories: string | null
  notes: string | null
  externalId: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

const iso = (v: Date | string): string =>
  v instanceof Date ? v.toISOString() : v

export function publicWorkout(w: WorkoutRow): PublicWorkout {
  return {
    id: w.id,
    source: w.source,
    startAt: iso(w.startAt),
    endAt: iso(w.endAt),
    minutes: w.minutes,
    speedMph: w.speedMph,
    inclinePct: w.inclinePct,
    distanceMi: w.distanceMi,
    steps: w.steps,
    calories: w.calories,
    notes: w.notes,
    externalId: w.externalId,
    createdAt: iso(w.createdAt),
    updatedAt: iso(w.updatedAt),
  }
}

/** Non-secret settings safe to expose publicly (goals + timezone). */
export interface PublicSettings {
  dailyStepGoal: number
  weeklyMilesGoal: string
  timezone: string
}

export function publicSettings(s: {
  dailyStepGoal: number
  weeklyMilesGoal: string
  timezone: string
  // `healthIngestSecret` intentionally omitted — never serialized publicly.
  [key: string]: unknown
}): PublicSettings {
  return {
    dailyStepGoal: s.dailyStepGoal,
    weeklyMilesGoal: s.weeklyMilesGoal,
    timezone: s.timezone,
  }
}
