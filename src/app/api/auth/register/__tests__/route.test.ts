// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

// Isolate the routes from the DB + session: gating logic is what we assert here.
// The real cryptographic attestation happy-path is exercised on a device (K16).
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
  setSessionCookie: vi.fn(),
}))
vi.mock("@/db/credentials.repo", () => ({
  countCredentials: vi.fn(),
  listCredentials: vi.fn(),
  saveCredential: vi.fn(),
}))
vi.mock("@/db/challenges.repo", () => ({
  createChallenge: vi.fn(),
  consumeChallenge: vi.fn(),
}))

import { getSession } from "@/lib/session"
import { countCredentials, listCredentials } from "@/db/credentials.repo"
import { createChallenge, consumeChallenge } from "@/db/challenges.repo"
import { POST as optionsPost } from "../options/route"
import { POST as verifyPost } from "../verify/route"

const SECRET = process.env.BOOTSTRAP_REGISTRATION_SECRET as string

function makeReq(opts: { secret?: string | null; body?: unknown } = {}): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost:3000",
  }
  if (opts.secret) headers["x-bootstrap-secret"] = opts.secret
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers,
    body: JSON.stringify(opts.body ?? {}),
  })
}

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue(null)
  vi.mocked(countCredentials).mockResolvedValue(0)
  vi.mocked(listCredentials).mockResolvedValue([])
  vi.mocked(createChallenge).mockResolvedValue(undefined)
  vi.mocked(consumeChallenge).mockResolvedValue("a-stored-challenge")
})

describe("POST /api/auth/register/options", () => {
  it("403 without a bootstrap secret", async () => {
    const res = await optionsPost(makeReq({ secret: null }))
    expect(res.status).toBe(403)
  })

  it("403 with the wrong bootstrap secret", async () => {
    const res = await optionsPost(makeReq({ secret: "nope" }))
    expect(res.status).toBe(403)
  })

  it("403 with a valid secret when credentials already exist and there is no session", async () => {
    vi.mocked(countCredentials).mockResolvedValue(1)
    const res = await optionsPost(makeReq({ secret: SECRET }))
    expect(res.status).toBe(403)
  })

  it("200 with options when secret valid and zero credentials exist", async () => {
    const res = await optionsPost(makeReq({ secret: SECRET }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.challenge).toBe("string")
    expect(body.rp.id).toBe("localhost")
    expect(createChallenge).toHaveBeenCalledWith({
      challenge: body.challenge,
      type: "registration",
    })
  })

  it("200 with options when secret valid and an owner session is present", async () => {
    vi.mocked(getSession).mockResolvedValue({ sub: "owner" })
    vi.mocked(countCredentials).mockResolvedValue(3) // ignored because session is present
    const res = await optionsPost(makeReq({ secret: SECRET }))
    expect(res.status).toBe(200)
  })
})

describe("POST /api/auth/register/verify", () => {
  it("403 without a bootstrap secret", async () => {
    const res = await verifyPost(makeReq({ secret: null, body: { response: {} } }))
    expect(res.status).toBe(403)
  })

  it("400 when the response is missing", async () => {
    const res = await verifyPost(makeReq({ secret: SECRET, body: {} }))
    expect(res.status).toBe(400)
  })

  it("400 when the stored challenge has expired", async () => {
    vi.mocked(consumeChallenge).mockResolvedValue(null)
    const res = await verifyPost(
      makeReq({ secret: SECRET, body: { response: { id: "x" } } }),
    )
    expect(res.status).toBe(400)
  })

  it("400 when the attestation fails verification", async () => {
    const res = await verifyPost(
      makeReq({ secret: SECRET, body: { response: { id: "bogus", response: {} } } }),
    )
    expect(res.status).toBe(400)
  })
})
