import { describe, expect, it } from "vitest"
import {
  bucketByWeek,
  bucketPaceIncline,
  rollingAverage,
  type DailyMilesPoint,
  type TreadmillWeekInput,
} from "../chart-data"

describe("bucketByWeek", () => {
  it("groups daily miles into ISO weeks (Mon start)", () => {
    // Week of 2026-05-25 starts Mon May 25 and ends Sun May 31
    const days: DailyMilesPoint[] = [
      { date: "2026-05-25", miles: 2 }, // Mon
      { date: "2026-05-27", miles: 3 }, // Wed
      { date: "2026-05-31", miles: 1.5 }, // Sun
      { date: "2026-06-01", miles: 2 }, // Mon (next week)
    ]
    const weeks = bucketByWeek(days)
    expect(weeks).toHaveLength(2)
    expect(weeks[0].weekStart).toBe("2026-05-25")
    expect(weeks[0].miles).toBeCloseTo(6.5, 5)
    expect(weeks[1].weekStart).toBe("2026-06-01")
    expect(weeks[1].miles).toBeCloseTo(2, 5)
  })

  it("returns empty array for no input", () => {
    expect(bucketByWeek([])).toEqual([])
  })
})

describe("rollingAverage", () => {
  it("computes n-window moving average and aligns labels", () => {
    const series = [
      { x: "w1", y: 4 },
      { x: "w2", y: 6 },
      { x: "w3", y: 8 },
      { x: "w4", y: 10 },
      { x: "w5", y: 12 },
    ]
    const avg = rollingAverage(series, 3, "y")
    expect(avg).toEqual([
      { x: "w1", avg: null },
      { x: "w2", avg: null },
      { x: "w3", avg: 6 },
      { x: "w4", avg: 8 },
      { x: "w5", avg: 10 },
    ])
  })

  it("returns nulls when window > input length", () => {
    const avg = rollingAverage([{ x: "a", y: 1 }], 4, "y")
    expect(avg).toEqual([{ x: "a", avg: null }])
  })
})

describe("bucketPaceIncline", () => {
  it("averages treadmill speed and incline per ISO week", () => {
    const workouts: TreadmillWeekInput[] = [
      { date: "2026-05-25", speedMph: 3.0, inclinePct: 2 }, // Mon
      { date: "2026-05-27", speedMph: 4.0, inclinePct: 4 }, // Wed, same week
      { date: "2026-06-01", speedMph: 3.5, inclinePct: 1 }, // next week
    ]
    const weeks = bucketPaceIncline(workouts)
    expect(weeks).toHaveLength(2)
    expect(weeks[0]).toEqual({
      weekStart: "2026-05-25",
      avgSpeedMph: 3.5,
      avgInclinePct: 3,
    })
    expect(weeks[1]).toEqual({
      weekStart: "2026-06-01",
      avgSpeedMph: 3.5,
      avgInclinePct: 1,
    })
  })

  it("skips null speed/incline values when averaging", () => {
    const weeks = bucketPaceIncline([
      { date: "2026-05-25", speedMph: 3.0, inclinePct: null },
      { date: "2026-05-26", speedMph: null, inclinePct: 4 },
    ])
    expect(weeks).toEqual([
      { weekStart: "2026-05-25", avgSpeedMph: 3.0, avgInclinePct: 4 },
    ])
  })

  it("returns null averages for a week with no values at all", () => {
    const weeks = bucketPaceIncline([
      { date: "2026-05-25", speedMph: null, inclinePct: null },
    ])
    expect(weeks).toEqual([
      { weekStart: "2026-05-25", avgSpeedMph: null, avgInclinePct: null },
    ])
  })

  it("returns empty array for no input", () => {
    expect(bucketPaceIncline([])).toEqual([])
  })
})
