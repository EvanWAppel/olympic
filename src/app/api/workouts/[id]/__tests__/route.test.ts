// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let PATCH: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>
let DELETE: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>
let db: typeof import("@/db/client").db
let workouts: typeof import("@/db/schema").workouts
let inArray: typeof import("drizzle-orm").inArray
let createWorkout: typeof import("@/db/workouts.repo").createWorkout

const createdIds: string[] = []

beforeAll(async () => {
  const route = await import("../route")
  PATCH = route.PATCH as never
  DELETE = route.DELETE as never
  db = (await import("@/db/client")).db
  workouts = (await import("@/db/schema")).workouts
  inArray = (await import("drizzle-orm")).inArray
  createWorkout = (await import("@/db/workouts.repo")).createWorkout
})

afterEach(async () => {
  if (createdIds.length > 0) {
    await db.delete(workouts).where(inArray(workouts.id, createdIds))
    createdIds.length = 0
  }
})

async function seed() {
  const row = await createWorkout({
    source: "treadmill",
    startAt: new Date("2099-05-31T18:00:00Z"),
    endAt: new Date("2099-05-31T18:45:00Z"),
    minutes: "45",
    speedMph: "3.5",
    inclinePct: "5",
    distanceMi: "2.625",
    steps: 5544,
    calories: "220",
  })
  createdIds.push(row.id)
  return row
}

describe("/api/workouts/[id]", () => {
  it("PATCH updates editable fields", async () => {
    const row = await seed()
    const res = await PATCH(
      new Request(`http://localhost/api/workouts/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          minutes: 30,
          speedMph: 4,
          inclinePct: 6,
          distanceMi: 2,
          steps: 4200,
          calories: 200,
          notes: "updated",
        }),
      }),
      { params: Promise.resolve({ id: row.id }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Number(body.minutes)).toBe(30)
    expect(Number(body.speedMph)).toBe(4)
    expect(body.notes).toBe("updated")
  })

  it("PATCH 404 on missing", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/workouts/00000000-0000-0000-0000-000000000000", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes: "x" }),
      }),
      { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }) },
    )
    expect(res.status).toBe(404)
  })

  it("DELETE removes the workout", async () => {
    const row = await seed()
    const res = await DELETE(
      new Request(`http://localhost/api/workouts/${row.id}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: row.id }) },
    )
    expect(res.status).toBe(204)
    const after = await db.select().from(workouts).where(inArray(workouts.id, [row.id]))
    expect(after).toHaveLength(0)
    // remove from cleanup tracker since it's already gone
    createdIds.length = 0
  })

  it("DELETE 404 on missing", async () => {
    const res = await DELETE(
      new Request("http://localhost/api/workouts/00000000-0000-0000-0000-000000000000", { method: "DELETE" }),
      { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }) },
    )
    expect(res.status).toBe(404)
  })
})
