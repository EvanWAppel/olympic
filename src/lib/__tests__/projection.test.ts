import { describe, expect, it } from "vitest"
import { projectYear } from "../projection"

describe("projectYear — pace", () => {
  it("projects year-end miles from year-to-date pace (today counts as elapsed)", () => {
    // 2026-04-10 is day 100 of 365. 400 mi / 100 d * 365 d = 1460.
    const p = projectYear({ ytdMiles: 400, today: "2026-04-10", goal: null })
    expect(p.daysElapsed).toBe(100)
    expect(p.daysInYear).toBe(365)
    expect(p.projectedMiles).toBe(1460)
  })

  it("handles leap years", () => {
    // 2028-12-31 is day 366 of 366: the projection equals YTD.
    const p = projectYear({ ytdMiles: 1234.5, today: "2028-12-31", goal: null })
    expect(p.daysInYear).toBe(366)
    expect(p.projectedMiles).toBe(1234.5)
  })

  it("rounds the projection to 1 decimal", () => {
    // 10 / 3 * 365 = 1216.66…
    const p = projectYear({ ytdMiles: 10, today: "2026-01-03", goal: null })
    expect(p.projectedMiles).toBe(1216.7)
  })

  it("has no goal fields when no goal is set", () => {
    const p = projectYear({ ytdMiles: 400, today: "2026-04-10", goal: null })
    expect(p.goal).toBeNull()
  })
})

describe("projectYear — against a goal", () => {
  it("reports how far ahead of the goal's pro-rata pace you are", () => {
    // Pro-rata at day 100: 1095 * 100/365 = 300. 400 is 33% ahead.
    const p = projectYear({ ytdMiles: 400, today: "2026-04-10", goal: 1095 })
    expect(p.goal).toMatchObject({ target: 1095, status: "on-track", paceVsGoalPct: 33 })
  })

  it("reports behind, with the weekly miles needed for the rest of the year", () => {
    // Day 100, 265 days (37.857 weeks) left. (1500 - 300) / 37.857 = 31.7 mi/wk.
    const p = projectYear({ ytdMiles: 300, today: "2026-04-10", goal: 1500 })
    expect(p.goal).toMatchObject({ status: "behind", paceVsGoalPct: -27, neededPerWeek: 31.7 })
  })

  it("reports met once year-to-date reaches the goal, needing nothing more", () => {
    const p = projectYear({ ytdMiles: 1000, today: "2026-09-01", goal: 900 })
    expect(p.goal).toMatchObject({ status: "met", neededPerWeek: 0 })
  })

  it("needs nothing per week on the last day of the year", () => {
    const p = projectYear({ ytdMiles: 100, today: "2026-12-31", goal: 1000 })
    expect(p.goal).toMatchObject({ status: "behind", neededPerWeek: 0 })
  })
})
