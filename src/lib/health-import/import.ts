import { db } from "@/db/client"
import { dailyMetric, workouts } from "@/db/schema"
import type { ParsedExport } from "./parse"

export interface ImportResult {
  dailyMetricsUpserted: number
  workoutsUpserted: number
}

export async function importHealthData(parsed: ParsedExport): Promise<ImportResult> {
  let metricsCount = 0
  let workoutsCount = 0

  for (const m of parsed.dailyMetrics) {
    const updatedAt = new Date()
    const steps = m.steps
    const distanceMi = m.distanceMi.toFixed(3)
    const activeCalories = m.activeCalories.toFixed(2)
    const result = await db
      .insert(dailyMetric)
      .values({
        date: m.date,
        steps,
        distanceMi,
        activeCalories,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: dailyMetric.date,
        set: { steps, distanceMi, activeCalories, updatedAt },
      })
      .returning({ date: dailyMetric.date })
    metricsCount += result.length
  }

  for (const w of parsed.workouts) {
    const result = await db
      .insert(workouts)
      .values({
        source: "outdoor",
        startAt: w.startAt,
        endAt: w.endAt,
        minutes: w.minutes.toFixed(2),
        distanceMi: w.distanceMi.toFixed(3),
        calories: w.calories.toFixed(2),
        externalId: w.externalId,
      })
      .onConflictDoNothing({ target: workouts.externalId })
      .returning({ id: workouts.id })
    if (result.length > 0) workoutsCount++
  }

  return {
    dailyMetricsUpserted: metricsCount,
    workoutsUpserted: workoutsCount,
  }
}
