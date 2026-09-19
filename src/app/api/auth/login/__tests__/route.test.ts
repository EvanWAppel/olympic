// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

// Isolate from DB + session; the real assertion happy-path is device-only (K16).
vi.mock("@/lib/session", () => ({
  setSessionCookie: vi.fn(),
}))
vi.mock("@/db/credentials.repo", () => ({
  listCredentials: vi.fn(),
  getCredentialById: vi.fn(),
  updateCredentialCounter: vi.fn(),
}))
vi.mock("@/db/challenges.repo", () => ({
  createChallenge: vi.fn(),
  consumeChallenge: vi.fn(),
}))

import {
  listCredentials,
  getCredentialById,
} from "@/db/credentials.repo"
import { createChallenge, consumeChallenge } from "@/db/challenges.repo"
import { POST as optionsPost } from "../options/route"
import { POST as verifyPost } from "../verify/route"

function makeReq(body: unknown = {}): Request {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify(body),
  })
}

const fakeCredential = {
  id: "cred-123",
  publicKey: Buffer.from("fake-key").toString("base64url"),
  counter: 5,
  transports: ["internal"],
  deviceLabel: "iPhone",
  createdAt: new Date(),
  lastUsedAt: null,
}

beforeEach(() => {
  vi.mocked(listCredentials).mockResolvedValue([fakeCredential])
  vi.mocked(getCredentialById).mockResolvedValue(fakeCredential)
  vi.mocked(createChallenge).mockResolvedValue(undefined)
  vi.mocked(consumeChallenge).mockResolvedValue("a-stored-challenge")
})

describe("POST /api/auth/login/options", () => {
  it("returns options and stores an authentication challenge", async () => {
    const res = await optionsPost(makeReq())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.challenge).toBe("string")
    expect(body.rpId).toBe("localhost")
    expect(createChallenge).toHaveBeenCalledWith({
      challenge: body.challenge,
      type: "authentication",
    })
  })

  it("lists the owner's credential in allowCredentials", async () => {
    const res = await optionsPost(makeReq())
    const body = await res.json()
    expect(body.allowCredentials?.map((c: { id: string }) => c.id)).toContain(
      "cred-123",
    )
  })
})

describe("POST /api/auth/login/verify", () => {
  it("400 when the response is missing", async () => {
    const res = await verifyPost(makeReq({}))
    expect(res.status).toBe(400)
  })

  it("400 when the stored challenge has expired", async () => {
    vi.mocked(consumeChallenge).mockResolvedValue(null)
    const res = await verifyPost(makeReq({ response: { id: "cred-123" } }))
    expect(res.status).toBe(400)
  })

  it("401 when the credential id is unknown", async () => {
    vi.mocked(getCredentialById).mockResolvedValue(null)
    const res = await verifyPost(makeReq({ response: { id: "unknown" } }))
    expect(res.status).toBe(401)
  })

  it("400 when the assertion fails verification", async () => {
    const res = await verifyPost(
      makeReq({ response: { id: "cred-123", response: {} } }),
    )
    expect(res.status).toBe(400)
  })
})
