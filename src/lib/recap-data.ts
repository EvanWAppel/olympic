import { countWorkoutsInYear, earliestDataDate } from "@/db/recap.repo"
import { getSettings } from "@/db/settings.repo"
import { getDailyTotalsRange } from "@/db/totals.repo"
import { localDateKey } from "@/lib/dates"
import { buildYearRecap, type YearRecap } from "@/lib/recap"

/**
 * Dependencies for the recap loaders, injectable so year validation and range
 * bounding can be unit tested without a live database. Defaults hit the DB.
 */
export interface RecapDeps {
  getSettings: () => Promise<{ timezone: string; dailyStepGoal: number }>
  getDailyTotalsRange: typeof getDailyTotalsRange
  /** Workouts whose start falls in `year` in the owner's local time. */
  countWorkoutsInYear: (year: number, timezone: string) => Promise<number>
  /** Earliest local date with any phone metric or workout, or null if none. */
  earliestDataDate: (timezone: string) => Promise<string | null>
  now: () => Date
}

const defaultDeps: RecapDeps = {
  getSettings,
  getDailyTotalsRange,
  countWorkoutsInYear,
  earliestDataDate,
  now: () => new Date(),
}

async function yearBounds(deps: RecapDeps, timezone: string) {
  const today = localDateKey(deps.now(), timezone)
  const currentYear = Number(today.slice(0, 4))
  const earliest = await deps.earliestDataDate(timezone)
  const firstYear = earliest ? Math.min(Number(earliest.slice(0, 4)), currentYear) : currentYear
  return { today, currentYear, firstYear }
}

/** Years that have a recap page, newest first. */
export async function listRecapYears(deps: RecapDeps = defaultDeps): Promise<number[]> {
  const { timezone } = await deps.getSettings()
  const { currentYear, firstYear } = await yearBounds(deps, timezone)
  return Array.from({ length: currentYear - firstYear + 1 }, (_, i) => currentYear - i)
}

/** The recap for `year`, or null when the year is outside the data's range. */
export async function getYearRecap(
  year: number,
  deps: RecapDeps = defaultDeps,
): Promise<YearRecap | null> {
  const settings = await deps.getSettings()
  const { today, currentYear, firstYear } = await yearBounds(deps, settings.timezone)
  if (!Number.isInteger(year) || year < firstYear || year > currentYear) return null

  const endDate = year === currentYear ? today : `${year}-12-31`
  const [days, workoutCount] = await Promise.all([
    deps.getDailyTotalsRange({
      startDate: `${year}-01-01`,
      endDate,
      timezone: settings.timezone,
    }),
    deps.countWorkoutsInYear(year, settings.timezone),
  ])

  return buildYearRecap({
    year,
    today,
    days,
    workoutCount,
    dailyStepGoal: settings.dailyStepGoal,
  })
}
