import { beforeAll, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"
// about-metrics transitively imports the DB client (its default deps query the
// DB); load env so the import-time guard passes, then import the module
// *dynamically* (a static import would hoist above this and throw). This test
// injects fake deps, so no real query is ever issued.
config({ path: ".env.local" })

import type { AboutMetricsDeps } from "../about-metrics"
let getAboutMetrics: typeof import("../about-metrics").getAboutMetrics

beforeAll(async () => {
  getAboutMetrics = (await import("../about-metrics")).getAboutMetrics
})

function makeDeps(overrides: Partial<AboutMetricsDeps> = {}): AboutMetricsDeps {
  return {
    countWorkouts: vi.fn(async () => 412),
    countDaysOfData: vi.fn(async () => 1774),
    getSettings: vi.fn(async () => ({
      timezone: "America/New_York",
      dailyStepGoal: 10_000,
    })),
    // Three consecutive days at/above goal ending "today".
    getDailyTotalsRange: vi.fn(async () => [
      { date: "2026-08-03", totalSteps: 5_000 },
      { date: "2026-08-05", totalSteps: 12_000 },
      { date: "2026-08-06", totalSteps: 11_000 },
      { date: "2026-08-07", totalSteps: 10_500 },
    ]) as unknown as AboutMetricsDeps["getDailyTotalsRange"],
    now: () => new Date("2026-08-07T12:00:00Z"),
    testCount: 189,
    ...overrides,
  }
}

describe("getAboutMetrics", () => {
  it("returns live, queried figures (not hardcoded)", async () => {
    const deps = makeDeps()
    const metrics = await getAboutMetrics(deps)

    expect(metrics.totalWorkouts).toBe(412)
    expect(metrics.daysOfData).toBe(1774)
    expect(metrics.testCount).toBe(189)
    // 2026-08-05/06/07 are consecutive and ≥ goal; 08-04 is missing → streak 3.
    expect(metrics.currentStreak).toBe(3)

    // Each figure came from a query, not a constant.
    expect(deps.countWorkouts).toHaveBeenCalledOnce()
    expect(deps.countDaysOfData).toHaveBeenCalledOnce()
    expect(deps.getDailyTotalsRange).toHaveBeenCalledOnce()
  })

  it("uses the configured timezone to bound the streak range", async () => {
    const getDailyTotalsRange = vi.fn(async () => []) as unknown as
      AboutMetricsDeps["getDailyTotalsRange"]
    const deps = makeDeps({ getDailyTotalsRange })

    await getAboutMetrics(deps)

    expect(getDailyTotalsRange).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: "America/New_York", endDate: "2026-08-07" }),
    )
  })
})
