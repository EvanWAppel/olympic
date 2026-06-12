import { and, between, eq, gte, lte } from "drizzle-orm"
import { db } from "./client"
import { dailyMetric, workouts } from "./schema"
import { displayedDailyTotals, type DisplayedDay } from "@/lib/dedup"
import { localDateKey } from "@/lib/dates"

export interface DailyTotalsRangeInput {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD inclusive
  timezone: string
}

function eachDate(start: string, end: string): string[] {
  const out: string[] = []
  const [sy, sm, sd] = start.split("-").map(Number)
  const [ey, em, ed] = end.split("-").map(Number)
  const cur = new Date(Date.UTC(sy, sm - 1, sd))
  const last = new Date(Date.UTC(ey, em - 1, ed))
  while (cur <= last) {
    out.push(
      `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}-${String(cur.getUTCDate()).padStart(2, "0")}`,
    )
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return out
}

export async function getDailyTotalsRange(
  input: DailyTotalsRangeInput,
): Promise<DisplayedDay[]> {
  const { startDate, endDate, timezone } = input

  // Phone-reported daily totals for the range.
  const phoneRows = await db
    .select()
    .from(dailyMetric)
    .where(between(dailyMetric.date, startDate, endDate))

  const phoneByDate = new Map(
    phoneRows.map((r) => [
      r.date,
      { steps: r.steps, distanceMi: Number(r.distanceMi), activeCalories: Number(r.activeCalories) },
    ]),
  )

  // Treadmill workouts whose startAt falls in the range (with a 1-day cushion
  // on each side to catch timezone edge cases).
  const cushionStart = new Date(`${startDate}T00:00:00Z`)
  cushionStart.setUTCDate(cushionStart.getUTCDate() - 1)
  const cushionEnd = new Date(`${endDate}T23:59:59Z`)
  cushionEnd.setUTCDate(cushionEnd.getUTCDate() + 1)

  const treadmillRows = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.source, "treadmill"),
        gte(workouts.startAt, cushionStart),
        lte(workouts.startAt, cushionEnd),
      ),
    )

  const treadmillByDate = new Map<
    string,
    Array<{ steps: number | null; distanceMi: number; calories: number | null }>
  >()
  for (const w of treadmillRows) {
    const key = localDateKey(w.startAt, timezone)
    let bucket = treadmillByDate.get(key)
    if (!bucket) {
      bucket = []
      treadmillByDate.set(key, bucket)
    }
    bucket.push({
      steps: w.steps,
      distanceMi: Number(w.distanceMi),
      calories: w.calories === null ? null : Number(w.calories),
    })
  }

  return eachDate(startDate, endDate).map((date) =>
    displayedDailyTotals({
      date,
      phone: phoneByDate.get(date) ?? null,
      treadmillWorkouts: treadmillByDate.get(date) ?? [],
    }),
  )
}
