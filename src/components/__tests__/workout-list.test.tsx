import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { WorkoutList } from "../workout-list"

const settings = { weightLb: 180, strideIn: 28 }

function makeWorkout(overrides: Partial<{
  id: string
  source: "treadmill" | "outdoor"
  startAt: string
  minutes: string
  speedMph: string | null
  inclinePct: string | null
  distanceMi: string
  steps: number | null
  calories: string | null
  notes: string | null
}>) {
  return {
    id: "id-1",
    source: "treadmill" as const,
    startAt: "2026-05-31T18:00:00.000Z",
    endAt: "2026-05-31T18:45:00.000Z",
    minutes: "45",
    speedMph: "3.5",
    inclinePct: "5",
    distanceMi: "2.625",
    steps: 5544,
    calories: "220",
    notes: null,
    externalId: null,
    createdAt: "2026-05-31T18:45:00.000Z",
    updatedAt: "2026-05-31T18:45:00.000Z",
    ...overrides,
  }
}

describe("<WorkoutList>", () => {
  it("renders an empty state when no workouts", () => {
    render(<WorkoutList workouts={[]} settings={settings} />)
    expect(screen.getByText(/no workouts/i)).toBeInTheDocument()
  })

  it("renders a row per workout with edit and delete affordances", () => {
    const workouts = [
      makeWorkout({ id: "a" }),
      makeWorkout({ id: "b", source: "outdoor", speedMph: null, inclinePct: null }),
    ]
    render(<WorkoutList workouts={workouts} settings={settings} />)
    expect(screen.getAllByRole("button", { name: /edit/i })).toHaveLength(2)
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(2)
  })

  it("tags outdoor workouts with a source badge", () => {
    const workouts = [
      makeWorkout({ id: "a" }),
      makeWorkout({ id: "b", source: "outdoor", speedMph: null, inclinePct: null }),
    ]
    render(<WorkoutList workouts={workouts} settings={settings} />)
    expect(screen.getByText(/outdoor/i)).toBeInTheDocument()
  })
})
