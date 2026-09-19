import { describe, expect, it } from "vitest"
import { publicSettings, publicWorkout } from "../dto"

describe("publicSettings", () => {
  it("whitelists goals + timezone and never leaks the ingest secret", () => {
    const row = {
      singleton: true,
      weightLb: "180",
      strideIn: "28",
      dailyStepGoal: 10_000,
      weeklyMilesGoal: "25",
      timezone: "America/New_York",
      healthIngestSecret: "super-secret-token",
    }

    const dto = publicSettings(row)

    expect(dto).toEqual({
      dailyStepGoal: 10_000,
      weeklyMilesGoal: "25",
      timezone: "America/New_York",
    })
    // The credential must never appear in a public serialization.
    expect(Object.keys(dto)).not.toContain("healthIngestSecret")
    expect(JSON.stringify(dto)).not.toContain("super-secret-token")
  })
})

describe("publicWorkout", () => {
  it("exposes only display fields and serializes dates to ISO strings", () => {
    const start = new Date("2026-05-31T18:00:00.000Z")
    const end = new Date("2026-05-31T18:45:00.000Z")
    const dto = publicWorkout({
      id: "w1",
      source: "treadmill",
      startAt: start,
      endAt: end,
      minutes: "45",
      speedMph: "3.5",
      inclinePct: "5",
      distanceMi: "2.625",
      steps: 5544,
      calories: "220",
      notes: null,
      externalId: null,
      createdAt: start,
      updatedAt: end,
    })

    expect(dto.startAt).toBe("2026-05-31T18:00:00.000Z")
    expect(dto.source).toBe("treadmill")
    expect(dto.steps).toBe(5544)
    // No stray/sensitive keys beyond the documented whitelist.
    expect(Object.keys(dto).sort()).toEqual(
      [
        "calories",
        "createdAt",
        "distanceMi",
        "endAt",
        "externalId",
        "id",
        "inclinePct",
        "minutes",
        "notes",
        "source",
        "speedMph",
        "startAt",
        "steps",
        "updatedAt",
      ].sort(),
    )
  })
})
