import { describe, expect, it } from "vitest"
import { eventMarkersFor, WORLD_EVENTS } from "../world-events"
import { isoWeekStart } from "../chart-data"

describe("eventMarkersFor", () => {
  it("matches an exact date for day granularity", () => {
    const markers = eventMarkersFor(
      ["2024-11-04", "2024-11-05", "2024-11-06"],
      "day",
    )
    expect(markers).toEqual([
      { x: "2024-11-05", label: "US election", date: "2024-11-05" },
    ])
  })

  it("snaps an event to its ISO week start for week granularity", () => {
    // 2024-11-05 (Tue) falls in the week starting Mon 2024-11-04.
    const weekStart = isoWeekStart("2024-11-05")
    expect(weekStart).toBe("2024-11-04")
    const markers = eventMarkersFor([weekStart], "week")
    expect(markers).toEqual([
      { x: "2024-11-04", label: "US election", date: "2024-11-05" },
    ])
  })

  it("drops events that fall outside the chart's categories", () => {
    expect(eventMarkersFor(["2030-01-01"], "day")).toEqual([])
    expect(eventMarkersFor(["2030-01-06"], "week")).toEqual([])
  })

  it("returns nothing for empty categories", () => {
    expect(eventMarkersFor([], "day")).toEqual([])
  })

  it("keeps the curated list sorted by date", () => {
    const dates = WORLD_EVENTS.map((e) => e.date)
    expect([...dates].sort()).toEqual(dates)
  })
})
