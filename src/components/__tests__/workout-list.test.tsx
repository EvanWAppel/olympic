import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
    render(<WorkoutList workouts={[]} settings={settings} timezone="America/New_York" />)
    expect(screen.getByText(/no workouts/i)).toBeInTheDocument()
  })

  it("renders a row per workout with edit and delete affordances", () => {
    const workouts = [
      makeWorkout({ id: "a" }),
      makeWorkout({ id: "b", source: "outdoor", speedMph: null, inclinePct: null }),
    ]
    render(<WorkoutList workouts={workouts} settings={settings} timezone="America/New_York" />)
    expect(screen.getAllByRole("button", { name: /edit/i })).toHaveLength(2)
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(2)
  })

  it("displays the workout time in the configured timezone, not the browser's", () => {
    // 2026-05-31T18:00:00Z is 2:00 PM in New York and 11:00 AM in Los Angeles.
    const w = makeWorkout({ id: "tz", startAt: "2026-05-31T18:00:00.000Z" })
    const { rerender } = render(
      <WorkoutList workouts={[w]} settings={settings} timezone="America/New_York" />,
    )
    expect(screen.getByRole("list")).toHaveTextContent(/2:00\s*PM/)

    rerender(
      <WorkoutList workouts={[w]} settings={settings} timezone="America/Los_Angeles" />,
    )
    expect(screen.getByRole("list")).toHaveTextContent(/11:00\s*AM/)
  })

  it("tags every row with its source badge", () => {
    const workouts = [
      makeWorkout({ id: "a" }),
      makeWorkout({ id: "b", source: "outdoor", speedMph: null, inclinePct: null }),
    ]
    render(<WorkoutList workouts={workouts} settings={settings} timezone="America/New_York" />)
    const list = screen.getByRole("list")
    expect(list).toHaveTextContent(/treadmill/i)
    expect(list).toHaveTextContent(/outdoor/i)
  })

  it("filters rows by source via chips", async () => {
    const user = userEvent.setup()
    const workouts = [
      makeWorkout({ id: "a" }),
      makeWorkout({ id: "b" }),
      makeWorkout({ id: "c", source: "outdoor", speedMph: null, inclinePct: null }),
    ]
    render(<WorkoutList workouts={workouts} settings={settings} timezone="America/New_York" />)
    expect(screen.getAllByRole("listitem")).toHaveLength(3)

    await user.click(screen.getByRole("button", { name: /^treadmill$/i }))
    expect(screen.getAllByRole("listitem")).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: /^outdoor$/i }))
    expect(screen.getAllByRole("listitem")).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: /^all$/i }))
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
  })

  it("paginates long lists with a load-more button", async () => {
    const user = userEvent.setup()
    const workouts = Array.from({ length: 120 }, (_, i) =>
      makeWorkout({ id: `w-${i}` }),
    )
    render(<WorkoutList workouts={workouts} settings={settings} timezone="America/New_York" />)
    expect(screen.getAllByRole("listitem")).toHaveLength(50)

    await user.click(screen.getByRole("button", { name: /load more/i }))
    expect(screen.getAllByRole("listitem")).toHaveLength(100)

    await user.click(screen.getByRole("button", { name: /load more/i }))
    expect(screen.getAllByRole("listitem")).toHaveLength(120)
    expect(
      screen.queryByRole("button", { name: /load more/i }),
    ).not.toBeInTheDocument()
  })

  it("resets pagination when the source filter changes", async () => {
    const user = userEvent.setup()
    const workouts = [
      ...Array.from({ length: 60 }, (_, i) => makeWorkout({ id: `t-${i}` })),
      ...Array.from({ length: 10 }, (_, i) =>
        makeWorkout({
          id: `o-${i}`,
          source: "outdoor",
          speedMph: null,
          inclinePct: null,
        }),
      ),
    ]
    render(<WorkoutList workouts={workouts} settings={settings} timezone="America/New_York" />)
    await user.click(screen.getByRole("button", { name: /load more/i }))
    expect(screen.getAllByRole("listitem")).toHaveLength(70)

    await user.click(screen.getByRole("button", { name: /^outdoor$/i }))
    expect(screen.getAllByRole("listitem")).toHaveLength(10)
  })
})
