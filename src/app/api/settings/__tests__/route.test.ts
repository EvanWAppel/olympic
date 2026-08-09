// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

// Owner-only route (exposes the ingest secret): mock an authenticated session.
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }))
import { getSession } from "@/lib/session"

let GET: (req: Request) => Promise<Response>
let PATCH: (req: Request) => Promise<Response>
let db: typeof import("@/db/client").db
let settings: typeof import("@/db/schema").settings
let getSettings: typeof import("@/db/settings.repo").getSettings

let snapshot: Awaited<ReturnType<typeof import("@/db/settings.repo").getSettings>> | null = null

beforeAll(async () => {
  const route = await import("../route")
  GET = route.GET as (req: Request) => Promise<Response>
  PATCH = route.PATCH as (req: Request) => Promise<Response>
  db = (await import("@/db/client")).db
  settings = (await import("@/db/schema")).settings
  getSettings = (await import("@/db/settings.repo")).getSettings
  snapshot = await getSettings()
})

afterAll(async () => {
  if (snapshot) {
    await db.update(settings).set({
      weightLb: snapshot.weightLb,
      strideIn: snapshot.strideIn,
      dailyStepGoal: snapshot.dailyStepGoal,
      weeklyMilesGoal: snapshot.weeklyMilesGoal,
      timezone: snapshot.timezone,
    })
  }
})

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ sub: "owner" })
})

describe("/api/settings", () => {
  it("returns 401 for GET and PATCH without an owner session", async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    const getRes = await GET(new Request("http://localhost/api/settings"))
    expect(getRes.status).toBe(401)
    const patchRes = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weightLb: 188 }),
      }),
    )
    expect(patchRes.status).toBe(401)
  })

  it("GET returns the settings row", async () => {
    const res = await GET(new Request("http://localhost/api/settings"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.singleton).toBe(true)
    expect(Number(body.weightLb)).toBeGreaterThan(0)
    expect(body.healthIngestSecret).toBeDefined()
  })

  it("PATCH updates editable fields and ignores unknown keys", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          weightLb: 188,
          strideIn: 29.5,
          dailyStepGoal: 12_000,
          weeklyMilesGoal: 30,
          timezone: "America/Chicago",
          healthIngestSecret: "should-be-ignored",
          foo: "bar",
        }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Number(body.weightLb)).toBe(188)
    expect(Number(body.strideIn)).toBe(29.5)
    expect(body.dailyStepGoal).toBe(12_000)
    expect(Number(body.weeklyMilesGoal)).toBe(30)
    expect(body.timezone).toBe("America/Chicago")
    expect(body.healthIngestSecret).toBe(snapshot?.healthIngestSecret)
  })

  it("PATCH returns 400 on invalid types", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weightLb: -10 }),
      }),
    )
    expect(res.status).toBe(400)
  })
})
