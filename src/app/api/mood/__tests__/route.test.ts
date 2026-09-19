// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

// POST is owner-only: mock the session so the guard sees an authenticated owner.
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }))
import { getSession } from "@/lib/session"

type Handler = (req?: Request) => Promise<Response>
let POST: Handler
let GET: Handler
let db: typeof import("@/db/client").db
let dailyMood: typeof import("@/db/schema").dailyMood
let eq: typeof import("drizzle-orm").eq
let getSettings: typeof import("@/db/settings.repo").getSettings
let localDateKey: typeof import("@/lib/dates").localDateKey

let today: string

beforeAll(async () => {
  const route = await import("../route")
  POST = route.POST as Handler
  GET = route.GET as Handler
  db = (await import("@/db/client")).db
  dailyMood = (await import("@/db/schema")).dailyMood
  eq = (await import("drizzle-orm")).eq
  getSettings = (await import("@/db/settings.repo")).getSettings
  localDateKey = (await import("@/lib/dates")).localDateKey

  const { timezone } = await getSettings()
  today = localDateKey(new Date(), timezone)
})

afterAll(async () => {
  await db.delete(dailyMood).where(eq(dailyMood.date, today))
})

function postReq(body: unknown) {
  return new Request("http://localhost/api/mood", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ sub: "owner" })
})

describe("POST /api/mood", () => {
  it("returns 401 without an owner session", async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    expect((await POST(postReq({ score: 6 }))).status).toBe(401)
  })

  it("stores today's mood and returns it", async () => {
    const res = await POST(postReq({ score: 6, comment: "ok day" }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.date).toBe(today)
    expect(body.score).toBe(6)
    expect(body.comment).toBe("ok day")
  })

  it("accepts a mood with no comment", async () => {
    const res = await POST(postReq({ score: 10 }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.score).toBe(10)
    expect(body.comment).toBeNull()
  })

  it("rejects scores outside 0–10", async () => {
    expect((await POST(postReq({ score: 11 }))).status).toBe(400)
    expect((await POST(postReq({ score: -1 }))).status).toBe(400)
    expect((await POST(postReq({ score: 3.5 }))).status).toBe(400)
  })

  it("rejects a missing score", async () => {
    expect((await POST(postReq({ comment: "hi" }))).status).toBe(400)
  })

  it("GET returns the latest entry for today", async () => {
    await POST(postReq({ score: 4 }))
    const res = await GET()
    const body = await res.json()
    expect(body.date).toBe(today)
    expect(body.score).toBe(4)
  })

  it("GET returns 401 without an owner session", async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    expect((await GET()).status).toBe(401)
  })
})
