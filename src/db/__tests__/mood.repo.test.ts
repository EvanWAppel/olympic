// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let getMood: typeof import("../mood.repo").getMood
let upsertMood: typeof import("../mood.repo").upsertMood
let db: typeof import("../client").db
let dailyMood: typeof import("../schema").dailyMood
let inArray: typeof import("drizzle-orm").inArray

const seededDates = ["2099-06-08", "2099-06-09"]

beforeAll(async () => {
  getMood = (await import("../mood.repo")).getMood
  upsertMood = (await import("../mood.repo")).upsertMood
  db = (await import("../client")).db
  dailyMood = (await import("../schema")).dailyMood
  inArray = (await import("drizzle-orm")).inArray
})

afterEach(async () => {
  await db.delete(dailyMood).where(inArray(dailyMood.date, seededDates))
})

describe("mood repo", () => {
  it("returns null when no entry exists for a date", async () => {
    expect(await getMood("2099-06-08")).toBeNull()
  })

  it("upserts a new entry and reads it back", async () => {
    const row = await upsertMood({
      date: "2099-06-08",
      score: 7,
      comment: "felt good",
    })
    expect(row.score).toBe(7)
    expect(row.comment).toBe("felt good")

    const fetched = await getMood("2099-06-08")
    expect(fetched?.score).toBe(7)
    expect(fetched?.comment).toBe("felt good")
  })

  it("overwrites the same day's entry instead of duplicating", async () => {
    await upsertMood({ date: "2099-06-09", score: 2, comment: "rough" })
    await upsertMood({ date: "2099-06-09", score: 9, comment: null })

    const fetched = await getMood("2099-06-09")
    expect(fetched?.score).toBe(9)
    expect(fetched?.comment).toBeNull()

    const all = await db
      .select()
      .from(dailyMood)
      .where(inArray(dailyMood.date, ["2099-06-09"]))
    expect(all).toHaveLength(1)
  })
})
