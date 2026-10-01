import { beforeAll, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"
// social-stats transitively imports the DB client (its default deps query the
// DB); load env so the import-time guard passes, then import the module
// *dynamically*. This test injects fake deps, so no real query is ever issued.
config({ path: ".env.local" })

import type { SocialStatsDeps } from "../social-stats"
let getSocialStats: typeof import("../social-stats").getSocialStats

beforeAll(async () => {
  getSocialStats = (await import("../social-stats")).getSocialStats
})

function makeDeps(overrides: Partial<SocialStatsDeps> = {}): SocialStatsDeps {
  return {
    countWorkouts: vi.fn(async () => 412),
    countDaysOfData: vi.fn(async () => 1774),
    getSettings: vi.fn(async () => ({
      timezone: "America/New_York",
      dailyStepGoal: 10_000,
    })),
    getDailyTotalsRange: vi.fn(async () => [
      // Prior year — excluded from year-to-date miles.
      { date: "2025-12-31", totalDistanceMi: 5, totalSteps: 11_000 },
      // This year.
      { date: "2026-01-02", totalDistanceMi: 3.2, totalSteps: 12_000 },
      // Three consecutive days at/above goal ending "today" → streak 3.
      { date: "2026-08-05", totalDistanceMi: 2.0, totalSteps: 12_000 },
      { date: "2026-08-06", totalDistanceMi: 2.0, totalSteps: 11_000 },
      { date: "2026-08-07", totalDistanceMi: 1.3, totalSteps: 10_500 },
    ]) as unknown as SocialStatsDeps["getDailyTotalsRange"],
    now: () => new Date("2026-08-07T12:00:00Z"),
    ...overrides,
  }
}

describe("getSocialStats", () => {
  it("sums year-to-date miles, excluding prior years", async () => {
    const stats = await getSocialStats(makeDeps())
    // 3.2 + 2.0 + 2.0 + 1.3 = 8.5 (the 2025-12-31 row is excluded).
    expect(stats.ytdMiles).toBe(8.5)
  })

  it("expresses YTD miles as marathon-equivalents (26.2 mi), 1 decimal", async () => {
    const stats = await getSocialStats(makeDeps())
    // 8.5 / 26.2 = 0.324… → 0.3
    expect(stats.marathons).toBe(0.3)
  })

  it("computes the current streak against the daily step goal", async () => {
    const stats = await getSocialStats(makeDeps())
    expect(stats.currentStreak).toBe(3)
  })

  it("passes through queried counts (not hardcoded)", async () => {
    const deps = makeDeps()
    const stats = await getSocialStats(deps)
    expect(stats.totalWorkouts).toBe(412)
    expect(stats.daysOfData).toBe(1774)
    expect(deps.countWorkouts).toHaveBeenCalledOnce()
    expect(deps.countDaysOfData).toHaveBeenCalledOnce()
  })

  it("bounds the totals range by the configured timezone and today", async () => {
    const getDailyTotalsRange = vi.fn(async () => []) as unknown as
      SocialStatsDeps["getDailyTotalsRange"]
    await getSocialStats(makeDeps({ getDailyTotalsRange }))
    expect(getDailyTotalsRange).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: "America/New_York", endDate: "2026-08-07" }),
    )
  })

  it("is safe on an empty history", async () => {
    const stats = await getSocialStats(
      makeDeps({
        getDailyTotalsRange: vi.fn(async () => []) as unknown as
          SocialStatsDeps["getDailyTotalsRange"],
        countWorkouts: vi.fn(async () => 0),
        countDaysOfData: vi.fn(async () => 0),
      }),
    )
    expect(stats).toEqual({
      ytdMiles: 0,
      marathons: 0,
      currentStreak: 0,
      totalWorkouts: 0,
      daysOfData: 0,
    })
  })
})
