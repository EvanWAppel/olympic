import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { YearRecapView } from "../year-recap-view"
import type { YearRecap } from "@/lib/recap"

function makeRecap(overrides: Partial<YearRecap> = {}): YearRecap {
  return {
    year: 2025,
    isPartial: false,
    throughDate: "2025-12-31",
    totals: { miles: 1204.3, marathons: 46, steps: 3_456_789, calories: 98_765, daysTracked: 351, workouts: 212 },
    biggestDay: { date: "2025-06-14", miles: 14.2, steps: 31_000 },
    bestWeek: { weekStart: "2025-06-09", miles: 48.5 },
    longestStreak: { days: 23, endDate: "2025-08-30" },
    split: { treadmillMi: 400.1, outdoorMi: 804.2, treadmillPct: 33 },
    months: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, miles: (i + 1) * 10 })),
    ...overrides,
  }
}

describe("<YearRecapView>", () => {
  it("headlines the year's miles and marathon-equivalent", () => {
    render(<YearRecapView recap={makeRecap()} years={[2026, 2025]} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("2025 in movement")
    expect(screen.getByText("1,204.3")).toBeInTheDocument()
    expect(screen.getByText(/46 marathons/)).toBeInTheDocument()
  })

  it("shows the headline totals", () => {
    render(<YearRecapView recap={makeRecap()} years={[2025]} />)
    expect(screen.getByText("3,456,789")).toBeInTheDocument()
    expect(screen.getByText("98,765")).toBeInTheDocument()
    expect(screen.getByText("351")).toBeInTheDocument()
    expect(screen.getByText("212")).toBeInTheDocument()
  })

  it("labels the current year as 'so far' with its through-date", () => {
    render(
      <YearRecapView
        recap={makeRecap({ year: 2026, isPartial: true, throughDate: "2026-10-10" })}
        years={[2026, 2025]}
      />,
    )
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("2026 in movement, so far")
    expect(screen.getByText(/through October 10, 2026/i)).toBeInTheDocument()
  })

  it("lists the best moments", () => {
    render(<YearRecapView recap={makeRecap()} years={[2025]} />)
    const moments = screen.getByRole("region", { name: /best moments/i })
    expect(within(moments).getByText(/June 14/)).toBeInTheDocument()
    expect(within(moments).getByText("14.2 mi")).toBeInTheDocument()
    expect(within(moments).getByText("48.5 mi")).toBeInTheDocument()
    expect(within(moments).getByText("23 days")).toBeInTheDocument()
    expect(within(moments).getByText(/33% treadmill/)).toBeInTheDocument()
  })

  it("omits moments that don't exist rather than showing zeros", () => {
    render(
      <YearRecapView
        recap={makeRecap({ biggestDay: null, bestWeek: null, longestStreak: null })}
        years={[2025]}
      />,
    )
    const moments = screen.getByRole("region", { name: /best moments/i })
    expect(within(moments).queryByText(/biggest day/i)).not.toBeInTheDocument()
    expect(within(moments).queryByText(/best week/i)).not.toBeInTheDocument()
    expect(within(moments).queryByText(/longest streak/i)).not.toBeInTheDocument()
  })

  it("renders an accessible month-by-month list, marking future months", () => {
    const months = makeRecap().months.map((m) => (m.month > 10 ? { ...m, miles: null } : m))
    render(<YearRecapView recap={makeRecap({ isPartial: true, months })} years={[2025]} />)
    const list = screen.getByRole("list", { name: /miles by month/i })
    const items = within(list).getAllByRole("listitem")
    expect(items).toHaveLength(12)
    expect(items[0]).toHaveAccessibleName("January: 10 miles")
    expect(items[11]).toHaveAccessibleName("December: not yet")
  })

  it("links to the other recap years, marking the current one", () => {
    render(<YearRecapView recap={makeRecap()} years={[2026, 2025, 2024]} />)
    const nav = screen.getByRole("navigation", { name: /recap years/i })
    expect(within(nav).getByRole("link", { name: "2026" })).toHaveAttribute("href", "/recap/2026")
    expect(within(nav).getByRole("link", { name: "2025" })).toHaveAttribute("aria-current", "page")
  })
})
