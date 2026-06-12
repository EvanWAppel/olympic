import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { TodayCard } from "../today-card"
import { StreakCard } from "../streak-card"
import { WeekCard } from "../week-card"
import { YtdCard } from "../ytd-card"

describe("TodayCard", () => {
  it("renders steps, goal, distance, calories, and % of goal", () => {
    render(
      <TodayCard steps={7500} distanceMi={3.21} calories={310} goal={10_000} />,
    )
    expect(screen.getByText("7,500")).toBeInTheDocument()
    expect(screen.getByText(/10,000 steps/)).toBeInTheDocument()
    expect(screen.getByText(/3\.21 mi/)).toBeInTheDocument()
    expect(screen.getByText(/310 cal/)).toBeInTheDocument()
    expect(screen.getByText(/75% of goal/)).toBeInTheDocument()
  })

  it("caps the progress display at 100%", () => {
    render(
      <TodayCard steps={15_000} distanceMi={6.4} calories={600} goal={10_000} />,
    )
    expect(screen.getByText(/150% of goal/)).toBeInTheDocument()
  })
})

describe("StreakCard", () => {
  it("renders the current streak in days", () => {
    render(<StreakCard days={12} />)
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText(/^days$/i)).toBeInTheDocument()
  })

  it("uses singular 'day' for a 1-day streak", () => {
    render(<StreakCard days={1} />)
    expect(screen.getByText(/^day$/i)).toBeInTheDocument()
  })
})

describe("WeekCard", () => {
  it("renders miles this week against the weekly goal", () => {
    render(<WeekCard miles={8.5} goalMiles={15} />)
    expect(screen.getByText("8.5")).toBeInTheDocument()
    expect(screen.getByText(/15 mi/)).toBeInTheDocument()
  })
})

describe("YtdCard", () => {
  it("renders cumulative miles and workout count for the year", () => {
    render(<YtdCard miles={142.7} workoutCount={58} />)
    expect(screen.getByText("142.7")).toBeInTheDocument()
    expect(screen.getByText(/58 workouts/)).toBeInTheDocument()
  })
})
