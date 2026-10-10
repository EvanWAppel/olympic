import { beforeAll, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"
// recap-data's default deps import the DB client; load env so the import-time
// guard passes, then import dynamically. Tests inject fake deps — no queries.
config({ path: ".env.local" })

import type { RecapDeps } from "../recap-data"
let getYearRecap: typeof import("../recap-data").getYearRecap
let listRecapYears: typeof import("../recap-data").listRecapYears

beforeAll(async () => {
  ;({ getYearRecap, listRecapYears } = await import("../recap-data"))
})

function makeDeps(overrides: Partial<RecapDeps> = {}): RecapDeps {
  return {
    getSettings: vi.fn(async () => ({ timezone: "America/New_York", dailyStepGoal: 10_000 })),
    getDailyTotalsRange: vi.fn(async () => []) as unknown as RecapDeps["getDailyTotalsRange"],
    countWorkoutsInYear: vi.fn(async () => 42),
    earliestDataDate: vi.fn(async () => "2024-03-15"),
    now: () => new Date("2026-10-10T16:00:00Z"),
    ...overrides,
  }
}

describe("listRecapYears", () => {
  it("lists every year from the earliest data through the current local year, newest first", async () => {
    expect(await listRecapYears(makeDeps())).toEqual([2026, 2025, 2024])
  })

  it("offers just the current year when there is no data yet", async () => {
    const deps = makeDeps({ earliestDataDate: vi.fn(async () => null) })
    expect(await listRecapYears(deps)).toEqual([2026])
  })

  it("uses the owner's timezone to decide the current year", async () => {
    // 02:00 UTC on Jan 1 is still Dec 31 in New York.
    const deps = makeDeps({ now: () => new Date("2027-01-01T02:00:00Z") })
    expect((await listRecapYears(deps))[0]).toBe(2026)
  })
})

describe("getYearRecap", () => {
  it("returns null for a year after the current one", async () => {
    expect(await getYearRecap(2027, makeDeps())).toBeNull()
  })

  it("returns null for a year before the earliest data", async () => {
    expect(await getYearRecap(2023, makeDeps())).toBeNull()
  })

  it("queries a past year Jan 1 → Dec 31 in the owner's timezone", async () => {
    const deps = makeDeps()
    const recap = await getYearRecap(2025, deps)
    expect(deps.getDailyTotalsRange).toHaveBeenCalledWith({
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      timezone: "America/New_York",
    })
    expect(deps.countWorkoutsInYear).toHaveBeenCalledWith(2025, "America/New_York")
    expect(recap?.isPartial).toBe(false)
    expect(recap?.totals.workouts).toBe(42)
  })

  it("queries the current year only through today", async () => {
    const deps = makeDeps()
    const recap = await getYearRecap(2026, deps)
    expect(deps.getDailyTotalsRange).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: "2026-01-01", endDate: "2026-10-10" }),
    )
    expect(recap?.isPartial).toBe(true)
  })

  it("feeds the deduped totals into the recap", async () => {
    const deps = makeDeps({
      getDailyTotalsRange: vi.fn(async () => [
        {
          date: "2025-05-01",
          totalSteps: 12_000,
          totalDistanceMi: 5,
          totalCalories: 400,
          treadmillDistanceMi: 2,
          outdoorDistanceMi: 3,
        },
      ]) as unknown as RecapDeps["getDailyTotalsRange"],
    })
    const recap = await getYearRecap(2025, deps)
    expect(recap?.totals.miles).toBe(5)
    expect(recap?.longestStreak).toEqual({ days: 1, endDate: "2025-05-01" })
  })
})
