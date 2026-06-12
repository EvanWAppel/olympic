import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { DailyStepsBar } from "../daily-steps-bar"
import { WeeklyMilesLine } from "../weekly-miles-line"
import { PaceInclineTrend } from "../pace-incline-trend"

/**
 * jsdom can't measure recharts' ResponsiveContainer (parent is 0×0),
 * so it warns and renders an empty inner div. These smoke tests verify
 * the wrapper mounts without throwing — exhaustive chart behavior is
 * out of scope for unit tests.
 */
describe("chart smoke tests", () => {
  it("DailyStepsBar mounts without crashing", () => {
    const { container } = render(
      <DailyStepsBar
        data={[
          { date: "2026-05-29", treadmillSteps: 5000, outdoorSteps: 3000 },
          { date: "2026-05-30", treadmillSteps: 0, outdoorSteps: 9000 },
        ]}
        goal={10_000}
      />,
    )
    expect(container.querySelector(".recharts-responsive-container")).toBeTruthy()
  })

  it("WeeklyMilesLine mounts with rolling-average prop", () => {
    const { container } = render(
      <WeeklyMilesLine
        weeks={[
          { weekStart: "2026-05-04", miles: 12 },
          { weekStart: "2026-05-11", miles: 15 },
          { weekStart: "2026-05-18", miles: 10 },
          { weekStart: "2026-05-25", miles: 18 },
          { weekStart: "2026-06-01", miles: 20 },
        ]}
        rollingWindow={4}
      />,
    )
    expect(container.querySelector(".recharts-responsive-container")).toBeTruthy()
  })

  it("PaceInclineTrend mounts for both speed and incline modes", () => {
    const data = [
      { weekStart: "2026-05-04", avgSpeedMph: 3.4, avgInclinePct: 4 },
      { weekStart: "2026-05-11", avgSpeedMph: 3.6, avgInclinePct: 5 },
    ]
    const speed = render(<PaceInclineTrend data={data} metric="speed" />)
    expect(speed.container.querySelector(".recharts-responsive-container")).toBeTruthy()
    const incline = render(<PaceInclineTrend data={data} metric="incline" />)
    expect(incline.container.querySelector(".recharts-responsive-container")).toBeTruthy()
  })
})
