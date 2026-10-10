// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let countWorkoutsInYear: typeof import("../recap.repo").countWorkoutsInYear
let earliestDataDate: typeof import("../recap.repo").earliestDataDate
let db: typeof import("../client").db
let workouts: typeof import("../schema").workouts
let dailyMetric: typeof import("../schema").dailyMetric
let inArray: typeof import("drizzle-orm").inArray
let createWorkout: typeof import("../workouts.repo").createWorkout

// 1989 can't collide with real data (the app's earliest records are 2020s).
const TZ = "America/New_York"
const createdWorkoutIds: string[] = []
const seededDates = ["1989-06-01"]

beforeAll(async () => {
  ;({ countWorkoutsInYear, earliestDataDate } = await import("../recap.repo"))
  db = (await import("../client")).db
  ;({ workouts, dailyMetric } = await import("../schema"))
  inArray = (await import("drizzle-orm")).inArray
  createWorkout = (await import("../workouts.repo")).createWorkout
})

afterEach(async () => {
  if (createdWorkoutIds.length > 0) {
    await db.delete(workouts).where(inArray(workouts.id, createdWorkoutIds))
    createdWorkoutIds.length = 0
  }
  await db.delete(dailyMetric).where(inArray(dailyMetric.date, seededDates))
})

async function seedWorkout(startIso: string) {
  const startAt = new Date(startIso)
  const row = await createWorkout({
    source: "outdoor",
    startAt,
    endAt: new Date(startAt.getTime() + 30 * 60_000),
    minutes: "30",
    distanceMi: "1.500",
  })
  createdWorkoutIds.push(row.id)
}

describe("countWorkoutsInYear", () => {
  it("buckets workouts by their local-time year, not UTC", async () => {
    // 03:00 UTC on Jan 1 1990 is 22:00 on Dec 31 1989 in New York.
    await seedWorkout("1990-01-01T03:00:00Z")
    await seedWorkout("1989-07-04T16:00:00Z")
    expect(await countWorkoutsInYear(1989, TZ)).toBe(2)
    expect(await countWorkoutsInYear(1989, "UTC")).toBe(1)
  })
})

describe("earliestDataDate", () => {
  it("returns the earliest local date across workouts and phone metrics", async () => {
    await db.insert(dailyMetric).values({ date: "1989-06-01", steps: 100, distanceMi: "0.1" })
    expect(await earliestDataDate(TZ)).toBe("1989-06-01")

    // A workout late on May 31 local (early Jun 1 UTC) is now the earliest.
    await seedWorkout("1989-06-01T02:00:00Z")
    expect(await earliestDataDate(TZ)).toBe("1989-05-31")
  })
})
