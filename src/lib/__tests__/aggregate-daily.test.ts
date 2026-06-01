import { describe, expect, it } from "vitest"
import { aggregateDailyMiles } from "../aggregate-daily"

describe("aggregateDailyMiles", () => {
  it("returns empty array for no workouts", () => {
    expect(aggregateDailyMiles([])).toEqual([])
  })

  it("groups workouts by local date and sums distance", () => {
    const result = aggregateDailyMiles([
      { startAt: new Date("2026-05-31T18:00:00Z"), distanceMi: "2.5" },
      { startAt: new Date("2026-05-31T07:00:00Z"), distanceMi: "1.0" },
      { startAt: new Date("2026-05-30T20:00:00Z"), distanceMi: "3.0" },
    ])
    expect(result).toHaveLength(2)
    const may31 = result.find((d) => d.date === "2026-05-31")
    const may30 = result.find((d) => d.date === "2026-05-30")
    expect(may31?.miles).toBeCloseTo(3.5, 5)
    expect(may30?.miles).toBeCloseTo(3.0, 5)
  })

  it("returns dates in ascending order", () => {
    const result = aggregateDailyMiles([
      { startAt: new Date("2026-05-31T18:00:00Z"), distanceMi: "1" },
      { startAt: new Date("2026-05-29T18:00:00Z"), distanceMi: "1" },
      { startAt: new Date("2026-05-30T18:00:00Z"), distanceMi: "1" },
    ])
    expect(result.map((d) => d.date)).toEqual([
      "2026-05-29",
      "2026-05-30",
      "2026-05-31",
    ])
  })
})
