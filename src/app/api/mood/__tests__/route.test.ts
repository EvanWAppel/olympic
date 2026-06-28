// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

type POST = (req: Request) => Promise<Response>
let POST: POST
let db: typeof import("@/db/client").db
let moodCheckins: typeof import("@/db/schema").moodCheckins
let inArray: typeof import("drizzle-orm").inArray

const createdIds: string[] = []

beforeAll(async () => {
  const route = await import("../route")
  const client = await import("@/db/client")
  const schema = await import("@/db/schema")
  const orm = await import("drizzle-orm")
  POST = route.POST as POST
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

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/mood", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  )
}

describe("POST /api/mood", () => {
  it("persists a score with a comment and returns it", async () => {
    const res = await post({ score: 8, comment: "feeling great" })
    expect(res.status).toBe(201)
    const body = await res.json()
    createdIds.push(body.id)

    expect(body.id).toBeDefined()
    expect(body.score).toBe(8)
    expect(body.comment).toBe("feeling great")
  })

  it("accepts a check-in without a comment", async () => {
    const res = await post({ score: 5 })
    expect(res.status).toBe(201)
    const body = await res.json()
    createdIds.push(body.id)
    expect(body.comment).toBeNull()
  })

  it("returns 400 when the score is out of the 1-10 range", async () => {
    expect((await post({ score: 0 })).status).toBe(400)
    expect((await post({ score: 11 })).status).toBe(400)
    expect((await post({ score: 5.5 })).status).toBe(400)
    expect((await post({ comment: "no score" })).status).toBe(400)
  })
})
