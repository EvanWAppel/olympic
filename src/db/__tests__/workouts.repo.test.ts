// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let createWorkout: typeof import("../workouts.repo").createWorkout
let listWorkouts: typeof import("../workouts.repo").listWorkouts
let db: typeof import("../client").db
let workouts: typeof import("../schema").workouts
let inArray: typeof import("drizzle-orm").inArray

const createdIds: string[] = []

beforeAll(async () => {
  const repo = await import("../workouts.repo")
  const client = await import("../client")
  const schema = await import("../schema")
  const orm = await import("drizzle-orm")
  createWorkout = repo.createWorkout
  listWorkouts = repo.listWorkouts
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

describe("workouts repo", () => {
  it("createWorkout inserts and returns the row", async () => {
    const start = new Date("2099-05-31T18:00:00Z")
    const end = new Date("2099-05-31T18:45:00Z")
    const row = await createWorkout({
      startAt: start,
      endAt: end,
      minutes: "45",
      speedMph: "3.5",
      inclinePct: "5.0",
      distanceMi: "2.625",
    })
    createdIds.push(row.id)

    expect(row.id).toBeDefined()
    expect(row.startAt.toISOString()).toBe(start.toISOString())
    expect(row.endAt.toISOString()).toBe(end.toISOString())
    expect(Number(row.minutes)).toBe(45)
    expect(Number(row.speedMph)).toBe(3.5)
    expect(Number(row.inclinePct)).toBe(5)
    expect(Number(row.distanceMi)).toBe(2.625)
    expect(row.createdAt).toBeInstanceOf(Date)
  })

  it("listWorkouts returns workouts ordered by startAt desc", async () => {
    const earlier = await createWorkout({
      startAt: new Date("2099-05-30T18:00:00Z"),
      endAt: new Date("2099-05-30T18:30:00Z"),
      minutes: "30",
      speedMph: "3.0",
      inclinePct: "2.0",
      distanceMi: "1.5",
    })
    const later = await createWorkout({
      startAt: new Date("2099-05-31T18:00:00Z"),
      endAt: new Date("2099-05-31T18:45:00Z"),
      minutes: "45",
      speedMph: "3.5",
      inclinePct: "5.0",
      distanceMi: "2.625",
    })
    createdIds.push(earlier.id, later.id)

    const list = await listWorkouts()
    const subset = list.filter((w) => createdIds.includes(w.id))
    expect(subset.map((w) => w.id)).toEqual([later.id, earlier.id])
  })
})
