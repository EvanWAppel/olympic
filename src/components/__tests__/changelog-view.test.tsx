import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { ChangelogView } from "../changelog-view"

const milestones = [
  { version: "v2", title: "Second", date: "2026-10-10", items: ["B one", "B two"] },
  { title: "First", date: "2026-06-22", items: ["A one"] },
]

describe("<ChangelogView>", () => {
  it("renders one article per milestone, in order, with its items", () => {
    render(<ChangelogView milestones={milestones} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Changelog")
    const headings = screen.getAllByRole("heading", { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual(["v2Second", "First"])
    const first = screen.getAllByRole("article")[0]
    expect(within(first).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "B one",
      "B two",
    ])
  })

  it("shows a machine-readable, timezone-stable date", () => {
    render(<ChangelogView milestones={milestones} />)
    const time = screen.getByText("October 10, 2026")
    expect(time.tagName).toBe("TIME")
    expect(time).toHaveAttribute("datetime", "2026-10-10")
  })
})
