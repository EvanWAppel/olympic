import { describe, expect, it } from "vitest"
import { displayedDailyTotals } from "../dedup"

describe("displayedDailyTotals", () => {
  it("passes through phone totals when there are no treadmill workouts", () => {
    const result = displayedDailyTotals({
      date: "2026-05-30",
      phone: { steps: 8000, distanceMi: 4, activeCalories: 300 },
      treadmillWorkouts: [],
    })
    expect(result).toEqual({
      date: "2026-05-30",
      treadmillSteps: 0,
      outdoorSteps: 8000,
      totalSteps: 8000,
      treadmillDistanceMi: 0,
      outdoorDistanceMi: 4,
      totalDistanceMi: 4,
      treadmillCalories: 0,
      outdoorCalories: 300,
      totalCalories: 300,
    })
  })

  it("subtracts a treadmill workout from phone totals", () => {
    const result = displayedDailyTotals({
      date: "2026-05-30",
      phone: { steps: 10_000, distanceMi: 5, activeCalories: 400 },
      treadmillWorkouts: [
        { steps: 5000, distanceMi: 2.5, calories: 250 },
      ],
    })
    // outdoor portion = phone minus treadmill
    expect(result.treadmillSteps).toBe(5000)
    expect(result.outdoorSteps).toBe(5000)
    expect(result.totalSteps).toBe(10_000)
    expect(result.treadmillDistanceMi).toBeCloseTo(2.5, 5)
    expect(result.outdoorDistanceMi).toBeCloseTo(2.5, 5)
    expect(result.totalDistanceMi).toBeCloseTo(5, 5)
    expect(result.treadmillCalories).toBeCloseTo(250, 5)
    expect(result.outdoorCalories).toBeCloseTo(150, 5)
  })

  it("clamps phone-minus-treadmill at 0 when treadmill exceeds phone", () => {
    const result = displayedDailyTotals({
      date: "2026-05-30",
      phone: { steps: 3000, distanceMi: 1, activeCalories: 100 },
      treadmillWorkouts: [
        { steps: 5000, distanceMi: 2.5, calories: 250 },
      ],
    })
    expect(result.outdoorSteps).toBe(0)
    expect(result.outdoorDistanceMi).toBe(0)
    expect(result.outdoorCalories).toBe(0)
    expect(result.totalSteps).toBe(5000)
    expect(result.totalDistanceMi).toBeCloseTo(2.5, 5)
    expect(result.totalCalories).toBeCloseTo(250, 5)
  })

  it("sums multiple treadmill workouts on the same day", () => {
    const result = displayedDailyTotals({
      date: "2026-05-30",
      phone: { steps: 12_000, distanceMi: 6, activeCalories: 500 },
      treadmillWorkouts: [
        { steps: 4000, distanceMi: 2, calories: 200 },
        { steps: 3000, distanceMi: 1.5, calories: 150 },
      ],
    })
    expect(result.treadmillSteps).toBe(7000)
    expect(result.outdoorSteps).toBe(5000)
    expect(result.totalSteps).toBe(12_000)
  })

  it("handles missing phone data (treadmill only)", () => {
    const result = displayedDailyTotals({
      date: "2026-05-30",
      phone: null,
      treadmillWorkouts: [{ steps: 5000, distanceMi: 2.5, calories: 250 }],
    })
    expect(result.treadmillSteps).toBe(5000)
    expect(result.outdoorSteps).toBe(0)
    expect(result.totalSteps).toBe(5000)
  })

  it("handles workouts with null steps/calories", () => {
    const result = displayedDailyTotals({
      date: "2026-05-30",
      phone: { steps: 8000, distanceMi: 4, activeCalories: 300 },
      treadmillWorkouts: [
        { steps: null, distanceMi: 2, calories: null },
      ],
    })
    expect(result.treadmillSteps).toBe(0)
    expect(result.outdoorSteps).toBe(8000)
    expect(result.totalSteps).toBe(8000)
    expect(result.treadmillDistanceMi).toBeCloseTo(2, 5)
  })
})
