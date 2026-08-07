import { count } from "drizzle-orm"
import { db } from "@/db/client"
import { workouts, dailyMetric } from "@/db/schema"
import { getSettings } from "@/db/settings.repo"
import { getDailyTotalsRange } from "@/db/totals.repo"
import { computeStreak } from "@/lib/streak"
import { addDays, localDateKey } from "@/lib/dates"
import { TEST_COUNT } from "@/lib/test-count.generated"

export interface AboutMetrics {
  /** All logged workouts (treadmill + imported outdoor). */
  totalWorkouts: number
  /** Days for which we have phone-reported daily metrics. */
  daysOfData: number
  /** Current consecutive-days streak hitting the daily step goal. */
  currentStreak: number
  /** Number of automated tests in the suite (captured at build). */
  testCount: number
}

/**
 * Dependencies for `getAboutMetrics`, injectable so the aggregation can be unit
 * tested without a live database. Defaults hit the real repos / DB.
 */
export interface AboutMetricsDeps {
  countWorkouts: () => Promise<number>
  countDaysOfData: () => Promise<number>
  getSettings: () => Promise<{ timezone: string; dailyStepGoal: number }>
  getDailyTotalsRange: typeof getDailyTotalsRange
  now: () => Date
  testCount: number
}

const defaultDeps: AboutMetricsDeps = {
  countWorkouts: async () => (await db.select({ n: count() }).from(workouts))[0]?.n ?? 0,
  countDaysOfData: async () =>
    (await db.select({ n: count() }).from(dailyMetric))[0]?.n ?? 0,
  getSettings,
  getDailyTotalsRange,
  now: () => new Date(),
  testCount: TEST_COUNT,
}

/**
 * Live metrics for the `/about` case study (PRD §8.2). All figures are queried
 * at render time (or captured at build for the test count) so the page proves
 * the system is real and maintained, rather than hardcoding numbers.
 */
export async function getAboutMetrics(
  deps: AboutMetricsDeps = defaultDeps,
): Promise<AboutMetrics> {
  const settings = await deps.getSettings()
  const today = localDateKey(deps.now(), settings.timezone)

  const [totalWorkouts, daysOfData, totals] = await Promise.all([
    deps.countWorkouts(),
    deps.countDaysOfData(),
    deps.getDailyTotalsRange({
      startDate: addDays(today, -400),
      endDate: today,
      timezone: settings.timezone,
    }),
  ])

  const currentStreak = computeStreak(
    totals.map((t) => ({ date: t.date, steps: t.totalSteps })),
    settings.dailyStepGoal,
  )

  return {
    totalWorkouts,
    daysOfData,
    currentStreak,
    testCount: deps.testCount,
  }
}
