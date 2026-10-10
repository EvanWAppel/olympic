import { describe, expect, it } from "vitest"
import { buildYearRecap, type RecapDay } from "../recap"

function day(date: string, overrides: Partial<RecapDay> = {}): RecapDay {
  return {
    date,
    totalSteps: 0,
    totalDistanceMi: 0,
    totalCalories: 0,
    treadmillDistanceMi: 0,
    outdoorDistanceMi: 0,
    ...overrides,
  }
}

function walk(date: string, treadmill: number, outdoor: number, steps: number, calories = 0) {
  return day(date, {
    totalSteps: steps,
    totalDistanceMi: treadmill + outdoor,
    totalCalories: calories,
    treadmillDistanceMi: treadmill,
    outdoorDistanceMi: outdoor,
  })
}

const base = { year: 2025, today: "2026-10-10", workoutCount: 7, dailyStepGoal: 10_000 }

describe("buildYearRecap — totals", () => {
  it("sums miles, steps, calories and rounds them for display", () => {
    const recap = buildYearRecap({
      ...base,
      days: [
        walk("2025-03-01", 2.04, 1.0, 9_000, 300.4),
        walk("2025-03-02", 0, 1.13, 4_000, 120.3),
      ],
    })
    expect(recap.totals.miles).toBe(4.2) // 4.17 → 1 decimal
    expect(recap.totals.steps).toBe(13_000)
    expect(recap.totals.calories).toBe(421) // whole calories
    expect(recap.totals.workouts).toBe(7)
  })

  it("expresses miles as marathon-equivalents (26.2 mi)", () => {
    const recap = buildYearRecap({ ...base, days: [walk("2025-05-05", 52.4, 0, 99_000)] })
    expect(recap.totals.marathons).toBe(2)
  })

  it("counts only days with any movement as tracked", () => {
    const recap = buildYearRecap({
      ...base,
      days: [walk("2025-01-01", 0, 1, 2_000), day("2025-01-02"), walk("2025-01-03", 0, 0, 50)],
    })
    expect(recap.totals.daysTracked).toBe(2)
  })

  it("ignores days outside the requested year", () => {
    const recap = buildYearRecap({
      ...base,
      days: [walk("2024-12-31", 0, 10, 20_000), walk("2025-01-01", 0, 1, 2_000), walk("2026-01-01", 0, 10, 20_000)],
    })
    expect(recap.totals.miles).toBe(1)
    expect(recap.totals.steps).toBe(2_000)
  })
})

describe("buildYearRecap — completeness", () => {
  it("marks a past year complete, covered through Dec 31", () => {
    const recap = buildYearRecap({ ...base, days: [] })
    expect(recap.isPartial).toBe(false)
    expect(recap.throughDate).toBe("2025-12-31")
  })

  it("marks the current year partial, covered through today", () => {
    const recap = buildYearRecap({ ...base, year: 2026, days: [] })
    expect(recap.isPartial).toBe(true)
    expect(recap.throughDate).toBe("2026-10-10")
  })
})

describe("buildYearRecap — best moments", () => {
  it("picks the biggest day by miles", () => {
    const recap = buildYearRecap({
      ...base,
      days: [walk("2025-02-01", 0, 3, 8_000), walk("2025-02-02", 4, 1.5, 12_000), walk("2025-02-03", 0, 2, 20_000)],
    })
    expect(recap.biggestDay).toEqual({ date: "2025-02-02", miles: 5.5, steps: 12_000 })
  })

  it("picks the best Monday-start week by miles", () => {
    const recap = buildYearRecap({
      ...base,
      days: [
        // Week of Mon 2025-06-02: 3 mi
        walk("2025-06-02", 0, 1, 1), walk("2025-06-08", 0, 2, 1),
        // Week of Mon 2025-06-09: 4.5 mi
        walk("2025-06-09", 0, 2, 1), walk("2025-06-15", 0, 2.5, 1),
      ],
    })
    expect(recap.bestWeek).toEqual({ weekStart: "2025-06-09", miles: 4.5 })
  })

  it("finds the longest step-goal streak within the year", () => {
    const recap = buildYearRecap({
      ...base,
      days: [
        walk("2025-04-01", 0, 5, 11_000), walk("2025-04-02", 0, 5, 12_000),
        walk("2025-04-03", 0, 1, 3_000),
        walk("2025-04-10", 0, 5, 10_000), walk("2025-04-11", 0, 5, 10_500), walk("2025-04-12", 0, 5, 15_000),
      ],
    })
    expect(recap.longestStreak).toEqual({ days: 3, endDate: "2025-04-12" })
  })

  it("splits miles into treadmill vs outdoor with a whole-number treadmill share", () => {
    const recap = buildYearRecap({
      ...base,
      days: [walk("2025-07-01", 1, 2, 5_000), walk("2025-07-02", 0, 0.5, 1_000)],
    })
    expect(recap.split).toEqual({ treadmillMi: 1, outdoorMi: 2.5, treadmillPct: 29 })
  })

  it("returns null moments and a 0% split for an empty year", () => {
    const recap = buildYearRecap({ ...base, days: [day("2025-01-01")] })
    expect(recap.biggestDay).toBeNull()
    expect(recap.bestWeek).toBeNull()
    expect(recap.longestStreak).toBeNull()
    expect(recap.split).toEqual({ treadmillMi: 0, outdoorMi: 0, treadmillPct: 0 })
  })
})

describe("buildYearRecap — months", () => {
  it("returns twelve monthly mile totals for a complete year", () => {
    const recap = buildYearRecap({
      ...base,
      days: [walk("2025-01-15", 0, 1.25, 1), walk("2025-01-16", 0, 1, 1), walk("2025-12-31", 3, 0, 1)],
    })
    expect(recap.months).toHaveLength(12)
    expect(recap.months[0]).toEqual({ month: 1, miles: 2.3 })
    expect(recap.months[5]).toEqual({ month: 6, miles: 0 })
    expect(recap.months[11]).toEqual({ month: 12, miles: 3 })
  })

  it("marks months after today as not-yet-happened (null) in a partial year", () => {
    const recap = buildYearRecap({ ...base, year: 2026, days: [walk("2026-10-01", 0, 2, 1)] })
    expect(recap.months[9]).toEqual({ month: 10, miles: 2 })
    expect(recap.months[10]).toEqual({ month: 11, miles: null })
    expect(recap.months[11]).toEqual({ month: 12, miles: null })
  })
})
