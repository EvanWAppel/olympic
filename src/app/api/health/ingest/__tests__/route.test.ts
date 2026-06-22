// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let POST: (req: Request) => Promise<Response>
let db: typeof import("@/db/client").db
let workouts: typeof import("@/db/schema").workouts
let dailyMetric: typeof import("@/db/schema").dailyMetric
let inArray: typeof import("drizzle-orm").inArray
let getSettings: typeof import("@/db/settings.repo").getSettings
let secret: string

const FIXTURE_DATES = ["2099-05-29", "2099-05-30", "2099-05-31"]
const FIXTURE_EXTERNAL_IDS = ["hae-walk-1", "hae-walk-2"]

beforeAll(async () => {
  POST = (await import("../route")).POST as never
  db = (await import("@/db/client")).db
  workouts = (await import("@/db/schema")).workouts
  dailyMetric = (await import("@/db/schema")).dailyMetric
  inArray = (await import("drizzle-orm")).inArray
  getSettings = (await import("@/db/settings.repo")).getSettings
  secret = (await getSettings()).healthIngestSecret
})

afterEach(async () => {
  await db.delete(dailyMetric).where(inArray(dailyMetric.date, FIXTURE_DATES))
  await db.delete(workouts).where(inArray(workouts.externalId, FIXTURE_EXTERNAL_IDS))
})

const validBody = {
  metrics: [
    { name: "step_count", units: "count", data: [{ date: "2099-05-29", qty: 8500 }] },
    { name: "walking_running_distance", units: "mi", data: [{ date: "2099-05-29", qty: 4.2 }] },
    { name: "active_energy", units: "kcal", data: [{ date: "2099-05-29", qty: 290 }] },
  ],
  workouts: [
    {
      id: "hae-walk-1",
      name: "Walking",
      start: "2099-05-29T07:00:00Z",
      end: "2099-05-29T07:45:00Z",
      distance: { qty: 2.5, units: "mi" },
      activeEnergyBurned: { qty: 180, units: "kcal" },
      steps: { qty: 5280, units: "count" },
    },
  ],
}

function makeReq(body: unknown, auth: string | null = `Bearer ${secret}`): Request {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (auth !== null) headers.authorization = auth
  return new Request("http://localhost/api/health/ingest", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
}

describe("POST /api/health/ingest", () => {
  it("returns 401 without an Authorization header", async () => {
    const res = await POST(makeReq(validBody, null))
    expect(res.status).toBe(401)
  })

  it("returns 401 with the wrong secret", async () => {
    const res = await POST(makeReq(validBody, "Bearer wrong-secret"))
    expect(res.status).toBe(401)
  })

  it("upserts daily metrics and workouts on valid auth", async () => {
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.dailyMetricsUpserted).toBe(1)
    expect(body.workoutsUpserted).toBe(1)

    const w = await db
      .select()
      .from(workouts)
      .where(inArray(workouts.externalId, ["hae-walk-1"]))
    expect(w).toHaveLength(1)
    expect(w[0].source).toBe("outdoor")
  })

  it("accepts the Health Auto Export shape wrapped under a `data` key", async () => {
    // The real Health Auto Export app posts { data: { metrics, workouts } }.
    const res = await POST(makeReq({ data: validBody }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.dailyMetricsUpserted).toBe(1)
    expect(body.workoutsUpserted).toBe(1)

    const [row] = await db
      .select()
      .from(dailyMetric)
      .where(inArray(dailyMetric.date, ["2099-05-29"]))
    expect(row.steps).toBe(8500)
  })

  it("is idempotent on workouts (same id is not duplicated)", async () => {
    await POST(makeReq(validBody))
    await POST(makeReq(validBody))
    const w = await db
      .select()
      .from(workouts)
      .where(inArray(workouts.externalId, ["hae-walk-1"]))
    expect(w).toHaveLength(1)
  })

  it("overwrites daily metrics on conflict", async () => {
    await POST(makeReq(validBody))
    const updated = {
      ...validBody,
      metrics: [
        { name: "step_count", units: "count", data: [{ date: "2099-05-29", qty: 9999 }] },
      ],
      workouts: [],
    }
    await POST(makeReq(updated))
    const [row] = await db
      .select()
      .from(dailyMetric)
      .where(inArray(dailyMetric.date, ["2099-05-29"]))
    expect(row.steps).toBe(9999)
  })
})
