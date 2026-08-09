// Deterministic sample data for the sign-in-free /demo dashboard.
// Nothing here touches the database or auth — the demo route renders the
// real dashboard components against these bundled, fake values so recruiters
// can explore a fully-populated (read-only) view.
import { addDays } from "@/lib/dates"

export const demoTimezone = "America/Los_Angeles"
export const demoStepGoal = 10000
export const demoMilesGoal = 15
export const demoSettings = { weightLb: 175, strideIn: 30 }

const STRIDE_IN = demoSettings.strideIn
const INCHES_PER_MILE = 63360

export interface DemoDailyTotal {
  date: string
  totalSteps: number
  totalDistanceMi: number
  totalCalories: number
  treadmillSteps: number
  outdoorSteps: number
}

export interface DemoWorkout {
  id: string
  source: "treadmill" | "outdoor"
  startAt: Date
  endAt: Date
  minutes: number
  speedMph: number | null
  inclinePct: number | null
  distanceMi: number
  steps: number
  calories: number
}

// Deterministic pseudo-random in [0, 1) so charts are stable across renders.
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function milesFromSteps(steps: number): number {
  return Math.round((steps * STRIDE_IN * 100) / INCHES_PER_MILE) / 100
}

/** 365 days of plausible daily totals ending on `today` (YYYY-MM-DD). */
export function demoDailyTotals(today: string): DemoDailyTotal[] {
  const out: DemoDailyTotal[] = []
  for (let i = 364; i >= 0; i--) {
    const date = addDays(today, -i)
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
    const weekend = dow === 0 || dow === 6
    const restDay = seeded(i * 3.1) < 0.12
    let steps = restDay
      ? Math.round(1500 + seeded(i) * 2500)
      : Math.round(6500 + (weekend ? 2500 : 0) + seeded(i * 1.7) * 5500)
    steps = Math.max(500, steps)
    const treadmillRatio = 0.45 + seeded(i * 2.3) * 0.4
    const treadmillSteps = Math.round(steps * treadmillRatio)
    out.push({
      date,
      totalSteps: steps,
      totalDistanceMi: milesFromSteps(steps),
      totalCalories: Math.round(steps * 0.045),
      treadmillSteps,
      outdoorSteps: steps - treadmillSteps,
    })
  }
  return out
}

/** ~14 recent workouts (mostly treadmill) for PRs and the pace/incline trend. */
export function demoWorkouts(today: string): DemoWorkout[] {
  const out: DemoWorkout[] = []
  const offsets = [0, 2, 3, 5, 7, 9, 11, 14, 16, 19, 21, 24, 27, 30]
  offsets.forEach((off, idx) => {
    const date = addDays(today, -off)
    const treadmill = seeded(idx * 5.5) > 0.25
    const minutes = Math.round(25 + seeded(idx * 1.3) * 35)
    const speedMph = treadmill
      ? Math.round((3.0 + seeded(idx * 2.7) * 1.3) * 10) / 10
      : null
    const inclinePct = treadmill
      ? Math.round(1 + seeded(idx * 3.9) * 7)
      : null
    const steps = Math.round(minutes * (treadmill ? 125 : 110))
    const start = new Date(`${date}T17:30:00`)
    out.push({
      id: `demo-${idx}`,
      source: treadmill ? "treadmill" : "outdoor",
      startAt: start,
      endAt: new Date(start.getTime() + minutes * 60_000),
      minutes,
      speedMph,
      inclinePct,
      distanceMi: milesFromSteps(steps),
      steps,
      calories: Math.round(steps * 0.045),
    })
  })
  return out
}
