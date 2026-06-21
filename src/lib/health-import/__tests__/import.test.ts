// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"
import { readFile } from "node:fs/promises"
import path from "node:path"

config({ path: ".env.local" })

let importHealthData: typeof import("../import").importHealthData
let parseHealthExport: typeof import("../parse").parseHealthExport
let db: typeof import("@/db/client").db
let workouts: typeof import("@/db/schema").workouts
let dailyMetric: typeof import("@/db/schema").dailyMetric
let eq: typeof import("drizzle-orm").eq
let inArray: typeof import("drizzle-orm").inArray

const FIXTURE = path.join(__dirname, "../__fixtures__/sample-export.xml")
const TZ = "America/Chicago"
const FIXTURE_DATES = ["2099-05-29", "2099-05-30", "2099-05-31"]
const FIXTURE_EXTERNAL_IDS = ["walk-uuid-001"]

beforeAll(async () => {
  importHealthData = (await import("../import")).importHealthData
  parseHealthExport = (await import("../parse")).parseHealthExport
  db = (await import("@/db/client")).db
  workouts = (await import("@/db/schema")).workouts
  dailyMetric = (await import("@/db/schema")).dailyMetric
  const orm = await import("drizzle-orm")
  eq = orm.eq
  inArray = orm.inArray
})

afterEach(async () => {
  await db.delete(dailyMetric).where(inArray(dailyMetric.date, FIXTURE_DATES))
  await db.delete(workouts).where(inArray(workouts.externalId, FIXTURE_EXTERNAL_IDS))
})

describe("importHealthData", () => {
  it("inserts daily metrics and walking workouts on first run", async () => {
    const xml = await readFile(FIXTURE, "utf-8")
    const parsed = await parseHealthExport(xml, TZ)
    const result = await importHealthData(parsed)

    expect(result.dailyMetricsUpserted).toBe(3)
    expect(result.workoutsUpserted).toBe(1)

    const metrics = await db
      .select()
      .from(dailyMetric)
      .where(inArray(dailyMetric.date, FIXTURE_DATES))
    expect(metrics).toHaveLength(3)

    const w = await db
      .select()
      .from(workouts)
      .where(eq(workouts.externalId, "walk-uuid-001"))
    expect(w).toHaveLength(1)
    expect(w[0].source).toBe("outdoor")
  })

  it("is idempotent — re-running the same import does not duplicate rows", async () => {
    const xml = await readFile(FIXTURE, "utf-8")
    const parsed = await parseHealthExport(xml, TZ)
    await importHealthData(parsed)
    await importHealthData(parsed)

    const metrics = await db
      .select()
      .from(dailyMetric)
      .where(inArray(dailyMetric.date, FIXTURE_DATES))
    expect(metrics).toHaveLength(3)

    const w = await db
      .select()
      .from(workouts)
      .where(eq(workouts.externalId, "walk-uuid-001"))
    expect(w).toHaveLength(1)
  })

  it("overwrites daily metrics with newer parsed values", async () => {
    await importHealthData({
      dailyMetrics: [
        { date: "2099-05-30", steps: 100, distanceMi: 0.1, activeCalories: 5 },
      ],
      workouts: [],
    })
    const xml = await readFile(FIXTURE, "utf-8")
    const parsed = await parseHealthExport(xml, TZ)
    await importHealthData(parsed)
    const [row] = await db
      .select()
      .from(dailyMetric)
      .where(eq(dailyMetric.date, "2099-05-30"))
    expect(row.steps).toBe(2200)
  })
})
