// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

// The secret route is owner-only (GET returns the ingest credential); mock the
// session. The ingest route it calls is NOT session-gated (bearer secret), so
// mocking @/lib/session leaves that path untouched.
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }))
import { getSession } from "@/lib/session"

let GET: (req: Request) => Promise<Response>
let POST: (req: Request) => Promise<Response>
let getSettings: typeof import("@/db/settings.repo").getSettings
let updateSettings: typeof import("@/db/settings.repo").updateSettings
let ingestPOST: (req: Request) => Promise<Response>

let originalSecret: string | null = null

beforeAll(async () => {
  GET = (await import("../route")).GET as never
  POST = (await import("../route")).POST as never
  ingestPOST = (await import("../../ingest/route")).POST as never
  getSettings = (await import("@/db/settings.repo")).getSettings
  updateSettings = (await import("@/db/settings.repo")).updateSettings
  originalSecret = (await getSettings()).healthIngestSecret
})

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ sub: "owner" })
})

afterAll(async () => {
  if (originalSecret) {
    await updateSettings({ healthIngestSecret: originalSecret })
  }
})

describe("GET /api/health/secret", () => {
  it("requires an owner session (closes the audit-flagged hole)", async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    const res = await GET(new Request("http://localhost/api/health/secret"))
    expect(res.status).toBe(401)
  })

  it("returns the secret to the owner", async () => {
    const res = await GET(new Request("http://localhost/api/health/secret"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.secret).toBeDefined()
  })
})

describe("POST /api/health/secret", () => {
  it("returns 401 without an owner session", async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    const res = await POST(new Request("http://localhost/api/health/secret", { method: "POST" }))
    expect(res.status).toBe(401)
  })

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
