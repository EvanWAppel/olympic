import { daysBetween } from "@/lib/dates"

const round1 = (n: number) => Math.round(n * 10) / 10

export interface GoalProgress {
  target: number
  /** met: YTD ≥ target · on-track: projection ≥ target · behind: otherwise. */
  status: "met" | "on-track" | "behind"
  /** YTD vs the target's straight-line share to date; +33 = 33% ahead. */
  paceVsGoalPct: number
  /** Miles per week needed for the rest of the year (0 once met or out of time). */
  neededPerWeek: number
}

export interface YearProjection {
  daysElapsed: number
  daysInYear: number
  /** Year-end total at the year-to-date pace, 1 decimal. */
  projectedMiles: number
  goal: GoalProgress | null
}

/**
 * Project the year-end mileage from the year-to-date pace. `today` (the
 * owner's local date) counts as elapsed, so early-day projections lean
 * slightly conservative.
 */
export function projectYear(input: {
  ytdMiles: number
  today: string
  goal: number | null
}): YearProjection {
  const year = input.today.slice(0, 4)
  const daysElapsed = daysBetween(`${year}-01-01`, input.today) + 1
  const daysInYear = daysBetween(`${year}-01-01`, `${year}-12-31`) + 1
  const projected = (input.ytdMiles / daysElapsed) * daysInYear

  let goal: GoalProgress | null = null
  if (input.goal !== null && input.goal > 0) {
    const target = input.goal
    const proRata = (target * daysElapsed) / daysInYear
    const weeksLeft = (daysInYear - daysElapsed) / 7
    const remaining = Math.max(0, target - input.ytdMiles)
    goal = {
      target,
      status: input.ytdMiles >= target ? "met" : projected >= target ? "on-track" : "behind",
      paceVsGoalPct: Math.round((input.ytdMiles / proRata - 1) * 100),
      neededPerWeek: weeksLeft > 0 ? round1(remaining / weeksLeft) : 0,
    }
  }

  return { daysElapsed, daysInYear, projectedMiles: round1(projected), goal }
}
