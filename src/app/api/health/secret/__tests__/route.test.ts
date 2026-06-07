// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

let POST: (req: Request) => Promise<Response>
let getSettings: typeof import("@/db/settings.repo").getSettings
let updateSettings: typeof import("@/db/settings.repo").updateSettings
let ingestPOST: (req: Request) => Promise<Response>

let originalSecret: string | null = null

beforeAll(async () => {
  POST = (await import("../route")).POST as never
  ingestPOST = (await import("../../ingest/route")).POST as never
  getSettings = (await import("@/db/settings.repo")).getSettings
  updateSettings = (await import("@/db/settings.repo")).updateSettings
  originalSecret = (await getSettings()).healthIngestSecret
})

afterAll(async () => {
  if (originalSecret) {
    await updateSettings({ healthIngestSecret: originalSecret })
  }
})

describe("POST /api/health/secret", () => {
  it("returns a new secret and invalidates the old one", async () => {
    const before = (await getSettings()).healthIngestSecret

    const res = await POST(new Request("http://localhost/api/health/secret", { method: "POST" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.secret).toBeDefined()
    expect(body.secret).not.toBe(before)
    expect(body.secret.length).toBeGreaterThan(16)

    // Old secret is rejected by ingest endpoint
    const stale = await ingestPOST(
      new Request("http://localhost/api/health/ingest", {
        method: "POST",
        headers: {
          authorization: `Bearer ${before}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ metrics: [], workouts: [] }),
      }),
    )
    expect(stale.status).toBe(401)

    // New secret works
    const fresh = await ingestPOST(
      new Request("http://localhost/api/health/ingest", {
        method: "POST",
        headers: {
          authorization: `Bearer ${body.secret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ metrics: [], workouts: [] }),
      }),
    )
    expect(fresh.status).toBe(200)
  })
})
