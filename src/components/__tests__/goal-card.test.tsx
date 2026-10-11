import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { GoalCard } from "../cards/goal-card"
import { projectYear } from "@/lib/projection"

// The editor island is tested on its own; here we only check it's mounted.
vi.mock("../goal-editor", () => ({
  GoalEditor: ({ initialGoal }: { initialGoal: number | null }) => (
    <div data-testid="goal-editor">{String(initialGoal)}</div>
  ),
}))

const at = (ytdMiles: number, goal: number | null, today = "2026-04-10") =>
  projectYear({ ytdMiles, today, goal })

describe("<GoalCard> public mode", () => {
  it("shows the projection, the goal, and how far ahead", () => {
    render(<GoalCard projection={at(400, 1095)} ownerMode={false} />)
    expect(screen.getByText("1,460")).toBeInTheDocument()
    expect(screen.getByText(/goal 1,095 mi/i)).toBeInTheDocument()
    expect(screen.getByText(/33% ahead of pace/i)).toBeInTheDocument()
    expect(screen.queryByTestId("goal-editor")).not.toBeInTheDocument()
  })

  it("puts the projection in landmark terms", () => {
    render(<GoalCard projection={at(400, null)} ownerMode={false} />)
    // 1460 mi → closest in scale is the Appalachian Trail (2197) at 0.66×.
    expect(screen.getByText(/66% of the Appalachian Trail/)).toBeInTheDocument()
  })

  it("shows behind status with the weekly miles needed", () => {
    render(<GoalCard projection={at(300, 1500)} ownerMode={false} />)
    expect(screen.getByText(/27% behind pace/i)).toBeInTheDocument()
    expect(screen.getByText(/31\.7 mi\/week to get there/i)).toBeInTheDocument()
  })

  it("celebrates a met goal", () => {
    render(<GoalCard projection={at(1000, 900, "2026-09-01")} ownerMode={false} />)
    expect(screen.getByText(/goal met/i)).toBeInTheDocument()
  })

  it("shows the projection alone when no goal is set", () => {
    render(<GoalCard projection={at(400, null)} ownerMode={false} />)
    expect(screen.getByText("1,460")).toBeInTheDocument()
    expect(screen.queryByText(/goal/i)).not.toBeInTheDocument()
  })
})

describe("<GoalCard> owner mode", () => {
  it("mounts the goal editor with the current goal", () => {
    render(<GoalCard projection={at(400, 1095)} ownerMode />)
    expect(screen.getByTestId("goal-editor")).toHaveTextContent("1095")
  })

  it("mounts the editor even with no goal yet, so one can be set", () => {
    render(<GoalCard projection={at(400, null)} ownerMode />)
    expect(screen.getByTestId("goal-editor")).toHaveTextContent("null")
  })
})
