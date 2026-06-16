// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"
import AdmZip from "adm-zip"

config({ path: ".env.local" })

let GET: () => Promise<Response>
let db: typeof import("@/db/client").db
let workouts: typeof import("@/db/schema").workouts
let dailyMetric: typeof import("@/db/schema").dailyMetric
let inArray: typeof import("drizzle-orm").inArray

const TEST_DATES = ["2099-01-01", "2099-01-02"]
const TEST_EXTERNAL_IDS = ["export-test-001"]

beforeAll(async () => {
  GET = (await import("../route")).GET as never
  db = (await import("@/db/client")).db
  workouts = (await import("@/db/schema")).workouts
  dailyMetric = (await import("@/db/schema")).dailyMetric
  inArray = (await import("drizzle-orm")).inArray
})

afterEach(async () => {
  await db.delete(dailyMetric).where(inArray(dailyMetric.date, TEST_DATES))
  await db.delete(workouts).where(inArray(workouts.externalId, TEST_EXTERNAL_IDS))
})

describe("GET /api/export", () => {
  it("returns a zip bundle of workouts.csv and daily_metrics.csv", async () => {
    await db.insert(dailyMetric).values({
      date: "2099-01-01",
      steps: 12345,
      distanceMi: "5.500",
      activeCalories: "400.00",
    })
    await db.insert(workouts).values({
      source: "outdoor",
      startAt: new Date("2099-01-01T15:00:00.000Z"),
      endAt: new Date("2099-01-01T15:45:00.000Z"),
      minutes: "45",
      distanceMi: "2.500",
      externalId: "export-test-001",
    })

    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("application/zip")
    expect(res.headers.get("content-disposition")).toContain(".zip")

    const buf = Buffer.from(await res.arrayBuffer())
    const zip = new AdmZip(buf)
    const names = zip.getEntries().map((e) => e.entryName).sort()
    expect(names).toEqual(["daily_metrics.csv", "workouts.csv"])

    const metricsCsv = zip.getEntry("daily_metrics.csv")!.getData().toString("utf-8")
    expect(metricsCsv.split("\n")[0]).toContain("date")
    expect(metricsCsv).toContain("2099-01-01")
    expect(metricsCsv).toContain("12345")

    const workoutsCsv = zip.getEntry("workouts.csv")!.getData().toString("utf-8")
    expect(workoutsCsv.split("\n")[0]).toContain("source")
    expect(workoutsCsv).toContain("export-test-001")
  })
})
