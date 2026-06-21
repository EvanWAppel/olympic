// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let getDailyTotalsRange: typeof import("../totals.repo").getDailyTotalsRange
let db: typeof import("../client").db
let workouts: typeof import("../schema").workouts
let dailyMetric: typeof import("../schema").dailyMetric
let inArray: typeof import("drizzle-orm").inArray
let createWorkout: typeof import("../workouts.repo").createWorkout
let getSettings: typeof import("../settings.repo").getSettings

const createdWorkoutIds: string[] = []
const seededDates = ["2099-06-08", "2099-06-09", "2099-06-10"]
let timezone: string

beforeAll(async () => {
  getDailyTotalsRange = (await import("../totals.repo")).getDailyTotalsRange
  db = (await import("../client")).db
  workouts = (await import("../schema")).workouts
  dailyMetric = (await import("../schema")).dailyMetric
  inArray = (await import("drizzle-orm")).inArray
  createWorkout = (await import("../workouts.repo")).createWorkout
  getSettings = (await import("../settings.repo")).getSettings
  timezone = (await getSettings()).timezone
})

afterEach(async () => {
  if (createdWorkoutIds.length > 0) {
    await db.delete(workouts).where(inArray(workouts.id, createdWorkoutIds))
    createdWorkoutIds.length = 0
  }
  await db.delete(dailyMetric).where(inArray(dailyMetric.date, seededDates))
})

async function seedTreadmill(localDate: string, steps: number, distanceMi: number, calories: number) {
  // Pick a time that is unambiguously inside `localDate` in the user's timezone:
  // noon local. Use a fixed UTC offset that's safe enough for the dates we use.
  const startAt = new Date(`${localDate}T17:00:00.000Z`)
  const endAt = new Date(startAt.getTime() + 30 * 60_000)
  const row = await createWorkout({
    source: "treadmill",
    startAt,
    endAt,
    minutes: "30",
    speedMph: "3.5",
    inclinePct: "5",
    distanceMi: distanceMi.toFixed(3),
    steps,
    calories: calories.toFixed(2),
  })
  createdWorkoutIds.push(row.id)
  return row
}

async function seedPhoneDay(date: string, steps: number, distanceMi: number, kcal: number) {
  await db.insert(dailyMetric).values({
    date,
    steps,
    distanceMi: distanceMi.toFixed(3),
    activeCalories: kcal.toFixed(2),
  })
}

describe("getDailyTotalsRange", () => {
  it("returns one entry per date in the range", async () => {
    await seedPhoneDay("2099-06-08", 8000, 4, 300)
    await seedPhoneDay("2099-06-09", 0, 0, 0)
    await seedPhoneDay("2099-06-10", 5000, 2.5, 200)

    const days = await getDailyTotalsRange({
      startDate: "2099-06-08",
      endDate: "2099-06-10",
      timezone,
    })
    expect(days.map((d) => d.date)).toEqual([
      "2099-06-08",
      "2099-06-09",
      "2099-06-10",
    ])
  })

  it("subtracts treadmill workouts from same-day phone totals", async () => {
    await seedPhoneDay("2099-06-08", 8000, 4, 300)
    await seedTreadmill("2099-06-08", 3000, 1.5, 120)

    const days = await getDailyTotalsRange({
      startDate: "2099-06-08",
      endDate: "2099-06-08",
      timezone,
    })
    const day = days[0]
    expect(day.treadmillSteps).toBe(3000)
    expect(day.outdoorSteps).toBe(5000)
    expect(day.totalSteps).toBe(8000)
  })

  it("returns zero-valued days when no data exists", async () => {
    const days = await getDailyTotalsRange({
      startDate: "2099-06-08",
      endDate: "2099-06-09",
      timezone,
    })
    expect(days).toHaveLength(2)
    expect(days[0].totalSteps).toBe(0)
    expect(days[1].totalSteps).toBe(0)
  })
})
