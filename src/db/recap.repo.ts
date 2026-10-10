import { count, min, sql } from "drizzle-orm"
import { db } from "./client"
import { dailyMetric, workouts } from "./schema"

/** A workout's start as a local calendar date in `timezone`. */
const localStartDate = (timezone: string) =>
  sql`(${workouts.startAt} at time zone ${timezone})::date`

/** Workouts (any source) whose start falls in `year`, in local time. */
export async function countWorkoutsInYear(year: number, timezone: string): Promise<number> {
  const rows = await db
    .select({ n: count() })
    .from(workouts)
    .where(sql`extract(year from ${localStartDate(timezone)}) = ${year}`)
  return rows[0]?.n ?? 0
}

/** Earliest local date (YYYY-MM-DD) with a phone metric or workout, or null. */
export async function earliestDataDate(timezone: string): Promise<string | null> {
  const [phone, workout] = await Promise.all([
    db.select({ d: min(dailyMetric.date) }).from(dailyMetric),
    db.select({ d: sql<string | null>`min(${localStartDate(timezone)})::text` }).from(workouts),
  ])
  const dates = [phone[0]?.d, workout[0]?.d].filter((d): d is string => !!d)
  return dates.length ? dates.sort()[0] : null
}
