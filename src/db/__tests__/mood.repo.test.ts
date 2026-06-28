// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let createMoodCheckin: typeof import("../mood.repo").createMoodCheckin
let listMoodCheckins: typeof import("../mood.repo").listMoodCheckins
let db: typeof import("../client").db
let moodCheckins: typeof import("../schema").moodCheckins
let inArray: typeof import("drizzle-orm").inArray

const createdIds: string[] = []

beforeAll(async () => {
  const repo = await import("../mood.repo")
  const client = await import("../client")
  const schema = await import("../schema")
  const orm = await import("drizzle-orm")
  createMoodCheckin = repo.createMoodCheckin
  listMoodCheckins = repo.listMoodCheckins
  db = client.db
  moodCheckins = schema.moodCheckins
  inArray = orm.inArray
})

afterEach(async () => {
  if (createdIds.length > 0) {
    await db.delete(moodCheckins).where(inArray(moodCheckins.id, createdIds))
    createdIds.length = 0
  }
})

describe("mood repo", () => {
  it("createMoodCheckin inserts and returns the row", async () => {
    const row = await createMoodCheckin({ score: 8, comment: "good day" })
    createdIds.push(row.id)

    expect(row.id).toBeDefined()
    expect(row.score).toBe(8)
    expect(row.comment).toBe("good day")
    expect(row.createdAt).toBeInstanceOf(Date)
  })

  it("createMoodCheckin allows a null comment", async () => {
    const row = await createMoodCheckin({ score: 5, comment: null })
    createdIds.push(row.id)
    expect(row.comment).toBeNull()
  })

  it("listMoodCheckins returns check-ins newest first", async () => {
    const earlier = await createMoodCheckin({
      score: 3,
      comment: null,
      createdAt: new Date("2099-05-30T18:00:00Z"),
    })
    const later = await createMoodCheckin({
      score: 9,
      comment: null,
      createdAt: new Date("2099-05-31T18:00:00Z"),
    })
    createdIds.push(earlier.id, later.id)

    const list = await listMoodCheckins()
    const subset = list.filter((m) => createdIds.includes(m.id))
    expect(subset.map((m) => m.id)).toEqual([later.id, earlier.id])
  })
})
