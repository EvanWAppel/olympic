// @vitest-environment node
import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { parseHealthExport } from "../parse"

const FIXTURE = path.join(__dirname, "../__fixtures__/sample-export.xml")

describe("parseHealthExport", () => {
  it("aggregates step records by local date", async () => {
    const xml = await readFile(FIXTURE, "utf-8")
    const parsed = await parseHealthExport(xml, "America/Chicago")

    const may29 = parsed.dailyMetrics.find((d) => d.date === "2026-05-29")
    const may30 = parsed.dailyMetrics.find((d) => d.date === "2026-05-30")
    const may31 = parsed.dailyMetrics.find((d) => d.date === "2026-05-31")

    expect(may29?.steps).toBe(1200)
    expect(may30?.steps).toBe(2200)
    expect(may31?.steps).toBe(800)
  })

  it("aggregates distance and converts km to miles", async () => {
    const xml = await readFile(FIXTURE, "utf-8")
    const parsed = await parseHealthExport(xml, "America/Chicago")

    const may29 = parsed.dailyMetrics.find((d) => d.date === "2026-05-29")
    const may30 = parsed.dailyMetrics.find((d) => d.date === "2026-05-30")

    expect(may29?.distanceMi).toBeCloseTo(0.6, 3)
    // 1.5 km → 0.9321 mi (1 km = 0.621371 mi)
    expect(may30?.distanceMi).toBeCloseTo(1.5 * 0.621371, 3)
  })

  it("sums active calories per day", async () => {
    const xml = await readFile(FIXTURE, "utf-8")
    const parsed = await parseHealthExport(xml, "America/Chicago")

    const may29 = parsed.dailyMetrics.find((d) => d.date === "2026-05-29")
    const may30 = parsed.dailyMetrics.find((d) => d.date === "2026-05-30")

    expect(may29?.activeCalories).toBeCloseTo(45, 1)
    expect(may30?.activeCalories).toBeCloseTo(200, 1) // 120 + 80
  })

  it("extracts only walking workouts with external ids", async () => {
    const xml = await readFile(FIXTURE, "utf-8")
    const parsed = await parseHealthExport(xml, "America/Chicago")

    expect(parsed.workouts).toHaveLength(1)
    const w = parsed.workouts[0]
    expect(w.externalId).toBe("walk-uuid-001")
    expect(w.startAt).toBeInstanceOf(Date)
    expect(w.endAt).toBeInstanceOf(Date)
    expect(w.minutes).toBeCloseTo(45, 0)
    expect(w.distanceMi).toBeCloseTo(0.9321, 3)
    expect(w.calories).toBeCloseTo(200, 1)
  })

  it("ignores non-walking workouts and unrelated quantity types", async () => {
    const xml = await readFile(FIXTURE, "utf-8")
    const parsed = await parseHealthExport(xml, "America/Chicago")
    expect(parsed.workouts.find((w) => w.externalId === "yoga-uuid-001")).toBeUndefined()
  })
})
