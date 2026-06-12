import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { PrsPanel } from "../prs-panel"
import type { PRs } from "@/lib/prs"

const prs: PRs = {
  longestWalkMinutes: { minutes: 95, setAt: "2026-06-08" },
  fastestAvgSpeedMph: { speedMph: 4.3, setAt: "2026-04-01" },
  mostStepsDay: { steps: 21_450, setAt: "2026-06-10" },
  longestStreak: { days: 14, setAt: "2026-05-01" },
}

describe("PrsPanel", () => {
  it("renders all four PR values", () => {
    render(<PrsPanel prs={prs} today="2026-06-11" />)
    expect(screen.getByText(/95 min/)).toBeInTheDocument()
    expect(screen.getByText(/4\.3 mph/)).toBeInTheDocument()
    expect(screen.getByText(/21,450/)).toBeInTheDocument()
    expect(screen.getByText(/14 days/)).toBeInTheDocument()
  })

  it("shows a 'new' badge only for PRs set within the last 7 days", () => {
    render(<PrsPanel prs={prs} today="2026-06-11" />)
    // longestWalk (3 days ago) and mostSteps (1 day ago) are new;
    // fastest (71 days ago) and streak (41 days ago) are not.
    expect(screen.getAllByText(/new/i)).toHaveLength(2)
  })

  it("counts a PR set exactly 7 days ago as new, 8 days ago as not", () => {
    const edge: PRs = {
      ...prs,
      longestWalkMinutes: { minutes: 95, setAt: "2026-06-04" }, // 7 days
      fastestAvgSpeedMph: { speedMph: 4.3, setAt: "2026-06-03" }, // 8 days
      mostStepsDay: { steps: 21_450, setAt: "2026-01-01" },
      longestStreak: { days: 14, setAt: "2026-01-01" },
    }
    render(<PrsPanel prs={edge} today="2026-06-11" />)
    expect(screen.getAllByText(/new/i)).toHaveLength(1)
  })

  it("renders placeholders when there are no PRs yet", () => {
    const empty: PRs = {
      longestWalkMinutes: null,
      fastestAvgSpeedMph: null,
      mostStepsDay: null,
      longestStreak: null,
    }
    render(<PrsPanel prs={empty} today="2026-06-11" />)
    expect(screen.getAllByText("—")).toHaveLength(4)
    expect(screen.queryByText(/new/i)).not.toBeInTheDocument()
  })
})
