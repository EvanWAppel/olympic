import type { DisplayedDay } from "@/lib/dedup"
import { bucketByWeek } from "@/lib/chart-data"
import { computePRs } from "@/lib/prs"

/** Statute miles in a marathon. */
const MARATHON_MI = 26.2

/** The per-day fields the recap reads from the deduped daily totals. */
export type RecapDay = Pick<
  DisplayedDay,
  | "date"
  | "totalSteps"
  | "totalDistanceMi"
  | "totalCalories"
  | "treadmillDistanceMi"
  | "outdoorDistanceMi"
>

export interface RecapInput {
  year: number
  /** Today's local date (YYYY-MM-DD) in the owner's timezone. */
  today: string
  days: RecapDay[]
  /** Workouts (treadmill + outdoor) that started in `year`, local time. */
  workoutCount: number
  dailyStepGoal: number
}

/**
 * "Year in movement" summary for one calendar year. Aggregate-only and
 * public-safe: no raw workout records, notes, or settings leave this shape.
 */
export interface YearRecap {
  year: number
  /** True for the current year (figures are "so far"). */
  isPartial: boolean
  /** Last date the figures cover: today for the current year, else Dec 31. */
  throughDate: string
  totals: {
    miles: number
    marathons: number
    steps: number
    calories: number
    daysTracked: number
    workouts: number
  }
  biggestDay: { date: string; miles: number; steps: number } | null
  bestWeek: { weekStart: string; miles: number } | null
  longestStreak: { days: number; endDate: string } | null
  split: { treadmillMi: number; outdoorMi: number; treadmillPct: number }
  /** Jan..Dec; `miles` is null for months that haven't happened yet. */
  months: Array<{ month: number; miles: number | null }>
}

const round1 = (n: number) => Math.round(n * 10) / 10
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export function buildYearRecap(input: RecapInput): YearRecap {
  const prefix = `${input.year}-`
  const days = input.days
    .filter((d) => d.date.startsWith(prefix))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const isPartial = input.today.startsWith(prefix)
  const throughDate = isPartial ? input.today : `${input.year}-12-31`

  const miles = sum(days.map((d) => d.totalDistanceMi))
  const treadmillMi = sum(days.map((d) => d.treadmillDistanceMi))
  const outdoorMi = sum(days.map((d) => d.outdoorDistanceMi))

  const moving = days.filter((d) => d.totalSteps > 0 || d.totalDistanceMi > 0)

  const biggest = moving.reduce<RecapDay | null>(
    (best, d) => (best && best.totalDistanceMi >= d.totalDistanceMi ? best : d),
    null,
  )

  const weeks = bucketByWeek(days.map((d) => ({ date: d.date, miles: d.totalDistanceMi })))
  const bestWeek = weeks.reduce<(typeof weeks)[number] | null>(
    (best, w) => (best && best.miles >= w.miles ? best : w),
    null,
  )

  const { longestStreak } = computePRs({
    workouts: [],
    dailySteps: days.map((d) => ({ date: d.date, steps: d.totalSteps })),
    goal: input.dailyStepGoal,
  })

  const currentMonth = isPartial ? Number(input.today.slice(5, 7)) : 12
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    if (month > currentMonth) return { month, miles: null }
    const mm = `${prefix}${String(month).padStart(2, "0")}-`
    return {
      month,
      miles: round1(sum(days.filter((d) => d.date.startsWith(mm)).map((d) => d.totalDistanceMi))),
    }
  })

  return {
    year: input.year,
    isPartial,
    throughDate,
    totals: {
      miles: round1(miles),
      marathons: round1(miles / MARATHON_MI),
      steps: Math.round(sum(days.map((d) => d.totalSteps))),
      calories: Math.round(sum(days.map((d) => d.totalCalories))),
      daysTracked: moving.length,
      workouts: input.workoutCount,
    },
    biggestDay:
      biggest && biggest.totalDistanceMi > 0
        ? { date: biggest.date, miles: round1(biggest.totalDistanceMi), steps: biggest.totalSteps }
        : null,
    bestWeek: bestWeek && bestWeek.miles > 0 ? { weekStart: bestWeek.weekStart, miles: round1(bestWeek.miles) } : null,
    longestStreak: longestStreak ? { days: longestStreak.days, endDate: longestStreak.setAt } : null,
    split: {
      treadmillMi: round1(treadmillMi),
      outdoorMi: round1(outdoorMi),
      treadmillPct: miles > 0 ? Math.round((treadmillMi / miles) * 100) : 0,
    },
    months,
  }
}
