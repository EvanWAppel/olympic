import { count } from "drizzle-orm"
import { db } from "@/db/client"
import { workouts, dailyMetric } from "@/db/schema"
import { getSettings } from "@/db/settings.repo"
import { getDailyTotalsRange } from "@/db/totals.repo"
import { computeStreak } from "@/lib/streak"
import { addDays, localDateKey } from "@/lib/dates"

/** Statute miles in a marathon. */
const MARATHON_MI = 26.2

/**
 * Headline figures for shareable surfaces — the dynamic OG card and the
 * year-in-movement recap. All aggregate, public-safe numbers (no raw records).
 */
export interface SocialStats {
  /** Year-to-date displayed miles, 1 decimal. */
  ytdMiles: number
  /** YTD miles expressed as marathon-equivalents (26.2 mi), 1 decimal. */
  marathons: number
  /** Current consecutive-days streak hitting the daily step goal. */
  currentStreak: number
  /** All logged workouts (treadmill + imported outdoor). */
  totalWorkouts: number
  /** Days for which we have phone-reported daily metrics. */
  daysOfData: number
}

/**
 * Dependencies for `getSocialStats`, injectable so the aggregation can be unit
 * tested without a live database. Defaults hit the real repos / DB.
 */
export interface SocialStatsDeps {
  countWorkouts: () => Promise<number>
  countDaysOfData: () => Promise<number>
  getSettings: () => Promise<{ timezone: string; dailyStepGoal: number }>
  getDailyTotalsRange: typeof getDailyTotalsRange
  now: () => Date
}

const defaultDeps: SocialStatsDeps = {
  countWorkouts: async () => (await db.select({ n: count() }).from(workouts))[0]?.n ?? 0,
  countDaysOfData: async () =>
    (await db.select({ n: count() }).from(dailyMetric))[0]?.n ?? 0,
  getSettings,
  getDailyTotalsRange,
  now: () => new Date(),
}

const round1 = (n: number) => Math.round(n * 10) / 10

export async function getSocialStats(
  deps: SocialStatsDeps = defaultDeps,
): Promise<SocialStats> {
  const settings = await deps.getSettings()
  const today = localDateKey(deps.now(), settings.timezone)
  const yearStart = `${today.slice(0, 4)}-01-01`

  const [totalWorkouts, daysOfData, totals] = await Promise.all([
    deps.countWorkouts(),
    deps.countDaysOfData(),
    deps.getDailyTotalsRange({
      startDate: addDays(today, -400),
      endDate: today,
      timezone: settings.timezone,
    }),
  ])

  const ytdMiles = round1(
    totals
      .filter((t) => t.date >= yearStart)
      .reduce((sum, t) => sum + t.totalDistanceMi, 0),
  )

  const currentStreak = computeStreak(
    totals.map((t) => ({ date: t.date, steps: t.totalSteps })),
    settings.dailyStepGoal,
  )

  return {
    ytdMiles,
    marathons: round1(ytdMiles / MARATHON_MI),
    currentStreak,
    totalWorkouts,
    daysOfData,
  }
}
