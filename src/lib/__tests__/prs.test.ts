import { describe, expect, it } from "vitest"
import { computePRs } from "../prs"

describe("computePRs", () => {
  it("returns null PRs when no data", () => {
    const prs = computePRs({ workouts: [], dailySteps: [], goal: 10_000 })
    expect(prs.longestWalkMinutes).toBeNull()
    expect(prs.fastestAvgSpeedMph).toBeNull()
    expect(prs.mostStepsDay).toBeNull()
    expect(prs.longestStreak).toBeNull()
  })

  it("picks longest walking workout by minutes, with the date it was set", () => {
    const prs = computePRs({
      workouts: [
        { source: "treadmill", minutes: 30, speedMph: 3.5, date: "2026-05-01" },
        { source: "treadmill", minutes: 60, speedMph: 3.0, date: "2026-05-10" },
        { source: "outdoor", minutes: 45, speedMph: null, date: "2026-05-12" },
      ],
      dailySteps: [],
      goal: 10_000,
    })
    expect(prs.longestWalkMinutes?.minutes).toBe(60)
    expect(prs.longestWalkMinutes?.setAt).toBe("2026-05-10")
  })

  it("keeps the earliest date when a later workout ties the record", () => {
    const prs = computePRs({
      workouts: [
        { source: "treadmill", minutes: 60, speedMph: 3.0, date: "2026-05-10" },
        { source: "treadmill", minutes: 60, speedMph: 3.0, date: "2026-05-20" },
      ],
      dailySteps: [],
      goal: 10_000,
    })
    expect(prs.longestWalkMinutes?.setAt).toBe("2026-05-10")
  })

  it("picks fastest avg-speed treadmill workout (ignoring outdoor with null)", () => {
    const prs = computePRs({
      workouts: [
        { source: "treadmill", minutes: 30, speedMph: 3.5, date: "2026-05-01" },
        { source: "treadmill", minutes: 30, speedMph: 4.2, date: "2026-05-02" },
        { source: "outdoor", minutes: 30, speedMph: null, date: "2026-05-03" },
      ],
      dailySteps: [],
      goal: 10_000,
    })
    expect(prs.fastestAvgSpeedMph?.speedMph).toBe(4.2)
    expect(prs.fastestAvgSpeedMph?.setAt).toBe("2026-05-02")
  })

  it("picks most-steps day", () => {
    const prs = computePRs({
      workouts: [],
      dailySteps: [
        { date: "2026-05-29", steps: 8_000 },
        { date: "2026-05-30", steps: 15_000 },
        { date: "2026-05-31", steps: 11_000 },
      ],
      goal: 10_000,
    })
    expect(prs.mostStepsDay?.steps).toBe(15_000)
    expect(prs.mostStepsDay?.setAt).toBe("2026-05-30")
  })

  it("computes longest streak ever (not just current), with its end date", () => {
    const prs = computePRs({
      workouts: [],
      dailySteps: [
        { date: "2026-05-20", steps: 11_000 },
        { date: "2026-05-21", steps: 12_000 },
        { date: "2026-05-22", steps: 13_000 },
        { date: "2026-05-23", steps: 14_000 },
        { date: "2026-05-24", steps: 5_000 }, // broken
        { date: "2026-05-25", steps: 11_000 },
      ],
      goal: 10_000,
    })
    expect(prs.longestStreak?.days).toBe(4)
    expect(prs.longestStreak?.setAt).toBe("2026-05-23")
  })
})
