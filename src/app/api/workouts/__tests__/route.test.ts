// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

type POST = (req: Request) => Promise<Response>
let POST: POST
let db: typeof import("@/db/client").db
let workouts: typeof import("@/db/schema").workouts
let inArray: typeof import("drizzle-orm").inArray

const createdIds: string[] = []

beforeAll(async () => {
  const route = await import("../route")
  const client = await import("@/db/client")
  const schema = await import("@/db/schema")
  const orm = await import("drizzle-orm")
  POST = route.POST as POST
  db = client.db
  workouts = schema.workouts
  inArray = orm.inArray
})

afterEach(async () => {
  if (createdIds.length > 0) {
    await db.delete(workouts).where(inArray(workouts.id, createdIds))
    createdIds.length = 0
  }
})

const validBody = {
  speedMph: 3.5,
  inclinePct: 5,
  minutes: 45,
  distanceMi: 2.625,
  steps: 5544,
  calories: 220,
  notes: "felt great",
}

describe("POST /api/workouts", () => {
  it("persists the full row and returns it", async () => {
    const req = new Request("http://localhost/api/workouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    createdIds.push(body.id)

    expect(body.id).toBeDefined()
    expect(body.source).toBe("treadmill")
    expect(Number(body.minutes)).toBe(45)
    expect(Number(body.speedMph)).toBe(3.5)
    expect(Number(body.inclinePct)).toBe(5)
    expect(Number(body.distanceMi)).toBeCloseTo(2.625, 3)
    expect(body.steps).toBe(5544)
    expect(Number(body.calories)).toBeCloseTo(220, 1)
    expect(body.notes).toBe("felt great")
    expect(new Date(body.startAt).getTime()).toBeLessThan(
      new Date(body.endAt).getTime(),
    )
    const windowMs = new Date(body.endAt).getTime() - new Date(body.startAt).getTime()
    expect(windowMs).toBe(45 * 60_000)
  })

  it("accepts a row without notes", async () => {
    const { notes: _ignored, ...rest } = validBody
    const req = new Request("http://localhost/api/workouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rest),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    createdIds.push(body.id)
    expect(body.notes).toBeNull()
  })

  it("returns 400 on invalid body", async () => {
    const req = new Request("http://localhost/api/workouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ speedMph: "fast", minutes: -1 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
