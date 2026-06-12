import { describe, expect, it } from "vitest"
import { computeStreak } from "../streak"

describe("computeStreak", () => {
  const goal = 10_000

  it("returns 0 for empty input", () => {
    expect(computeStreak([], goal)).toBe(0)
  })

  it("returns 0 when most recent day misses goal", () => {
    const days = [
      { date: "2026-05-28", steps: 12_000 },
      { date: "2026-05-29", steps: 11_000 },
      { date: "2026-05-30", steps: 5_000 }, // most recent — missed
    ]
    expect(computeStreak(days, goal)).toBe(0)
  })

  it("counts consecutive trailing days that meet goal", () => {
    const days = [
      { date: "2026-05-26", steps: 8_000 }, // misses (breaks streak)
      { date: "2026-05-27", steps: 11_000 },
      { date: "2026-05-28", steps: 12_000 },
      { date: "2026-05-29", steps: 10_500 },
      { date: "2026-05-30", steps: 14_000 },
    ]
    expect(computeStreak(days, goal)).toBe(4)
  })

  it("handles a single day of hitting goal", () => {
    expect(computeStreak([{ date: "2026-05-30", steps: 10_500 }], goal)).toBe(1)
  })

  it("requires unbroken consecutive dates (a gap breaks the streak)", () => {
    const days = [
      { date: "2026-05-27", steps: 11_000 },
      { date: "2026-05-28", steps: 12_000 },
      // gap on 2026-05-29
      { date: "2026-05-30", steps: 14_000 },
    ]
    expect(computeStreak(days, goal)).toBe(1)
  })
})
