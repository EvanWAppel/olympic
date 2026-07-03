import { describe, expect, it } from "vitest"
import { demoDailyTotals, demoWorkouts } from "@/lib/demo/sample"

const TODAY = "2026-07-03"

describe("demo sample data", () => {
  it("produces a year of daily totals ending on `today`", () => {
    const totals = demoDailyTotals(TODAY)
    expect(totals).toHaveLength(365)
    expect(totals[totals.length - 1].date).toBe(TODAY)
    for (const t of totals) {
      expect(t.totalSteps).toBeGreaterThan(0)
      expect(t.treadmillSteps + t.outdoorSteps).toBe(t.totalSteps)
      expect(t.totalDistanceMi).toBeGreaterThan(0)
    }
  })

  it("is deterministic for the same day", () => {
    expect(demoDailyTotals(TODAY)).toEqual(demoDailyTotals(TODAY))
  })

  it("produces treadmill workouts with pace and incline", () => {
    const w = demoWorkouts(TODAY)
    expect(w.length).toBeGreaterThan(5)
    const treadmill = w.filter((x) => x.source === "treadmill")
    expect(treadmill.length).toBeGreaterThan(0)
    for (const t of treadmill) {
      expect(t.speedMph).not.toBeNull()
      expect(t.inclinePct).not.toBeNull()
      expect(t.minutes).toBeGreaterThan(0)
    }
  })
})
