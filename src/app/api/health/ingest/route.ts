import { NextResponse } from "next/server"
import { z } from "zod"
import { timingSafeEqual } from "node:crypto"
import { db } from "@/db/client"
import { dailyMetric, workouts } from "@/db/schema"
import { getSettings } from "@/db/settings.repo"

export const runtime = "nodejs"

const KM_TO_MI = 0.621371

const MetricPoint = z.object({
  date: z.string(),
  qty: z.number(),
})

const Metric = z.object({
  name: z.string(),
  units: z.string().optional(),
  data: z.array(MetricPoint),
})

const Quantity = z.object({
  qty: z.number(),
  units: z.string().optional(),
})

const Workout = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  start: z.string(),
  end: z.string(),
  distance: Quantity.optional(),
  activeEnergyBurned: Quantity.optional(),
  steps: Quantity.optional(),
})

const Payload = z.object({
  metrics: z.array(Metric).default([]),
  workouts: z.array(Workout).default([]),
})

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 })
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

function toMi(value: number, units?: string): number {
  const u = (units ?? "mi").toLowerCase()
  if (u === "mi" || u === "miles") return value
  if (u === "km") return value * KM_TO_MI
  if (u === "m") return value * 0.000621371
  return value
}

function toKcal(value: number, units?: string): number {
  const u = (units ?? "kcal").toLowerCase()
  if (u === "kcal" || u === "cal" || u === "kilocalorie") return value
  if (u === "j") return value / 4184
  return value
}

interface DailyAgg {
  steps: number
  distanceMi: number
  activeCalories: number
}

// NOTE: Health Auto Export already emits each data point's `date` as a local
// calendar day (YYYY-MM-DD) on the phone. We trust that local date as-is rather
// than re-deriving it from an instant, so daily buckets match what the user saw
// on their device. If the phone's timezone differs from `settings.timezone`,
// the phone's day wins for these phone-sourced metrics — which is the intent.
function aggregateMetrics(metrics: z.infer<typeof Metric>[]): Map<string, DailyAgg> {
  const out = new Map<string, DailyAgg>()
  function bucket(date: string): DailyAgg {
    let b = out.get(date)
    if (!b) {
      b = { steps: 0, distanceMi: 0, activeCalories: 0 }
      out.set(date, b)
    }
    return b
  }
  for (const m of metrics) {
    const key = m.name.toLowerCase()
    for (const point of m.data) {
      const b = bucket(point.date)
      if (key === "step_count" || key === "steps") {
        b.steps += Math.round(point.qty)
      } else if (
        key === "walking_running_distance" ||
        key === "distance_walking_running" ||
        key === "distance"
      ) {
        b.distanceMi += toMi(point.qty, m.units)
      } else if (
        key === "active_energy" ||
        key === "active_energy_burned" ||
        key === "activeenergyburned"
      ) {
        b.activeCalories += toKcal(point.qty, m.units)
      }
    }
  }
  return out
}

export async function POST(req: Request) {
  const settings = await getSettings()
  const auth = req.headers.get("authorization") ?? ""
  const match = auth.match(/^Bearer\s+(.+)$/i)
  if (!match || !safeEqual(match[1], settings.healthIngestSecret)) {
    return unauthorized()
  }

  const json = await req.json().catch(() => null)
  const parsed = Payload.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const aggregated = aggregateMetrics(parsed.data.metrics)

  let dailyCount = 0
  for (const [date, m] of aggregated) {
    const updatedAt = new Date()
    const distanceMi = m.distanceMi.toFixed(3)
    const activeCalories = m.activeCalories.toFixed(2)
    const result = await db
      .insert(dailyMetric)
      .values({
        date,
        steps: m.steps,
        distanceMi,
        activeCalories,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: dailyMetric.date,
        set: { steps: m.steps, distanceMi, activeCalories, updatedAt },
      })
      .returning({ date: dailyMetric.date })
    dailyCount += result.length
  }

  let workoutCount = 0
  for (const w of parsed.data.workouts) {
    const startAt = new Date(w.start)
    const endAt = new Date(w.end)
    const minutes = (endAt.getTime() - startAt.getTime()) / 60_000
    const distanceMi = w.distance ? toMi(w.distance.qty, w.distance.units) : 0
    const calories = w.activeEnergyBurned
      ? toKcal(w.activeEnergyBurned.qty, w.activeEnergyBurned.units)
      : 0
    const steps = w.steps ? Math.round(w.steps.qty) : null

    const result = await db
      .insert(workouts)
      .values({
        source: "outdoor",
        startAt,
        endAt,
        minutes: minutes.toFixed(2),
        distanceMi: distanceMi.toFixed(3),
        calories: calories.toFixed(2),
        steps,
        externalId: w.id,
      })
      .onConflictDoNothing({ target: workouts.externalId })
      .returning({ id: workouts.id })
    if (result.length > 0) workoutCount++
  }

  return NextResponse.json({
    dailyMetricsUpserted: dailyCount,
    workoutsUpserted: workoutCount,
  })
}
