// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { config } from "dotenv"

config({ path: ".env.local" })

// In-memory cookie jar standing in for Next's request/response cookie store.
const jar = new Map<string, string>()

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = jar.get(name)
      return value === undefined ? undefined : { name, value }
    },
    set: (name: string, value: string) => {
      jar.set(name, value)
    },
    delete: (name: string) => {
      jar.delete(name)
    },
  }),
}))

import {
  createSessionToken,
  verifySessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  requireOwner,
  UnauthorizedError,
} from "../session"

beforeEach(() => {
  jar.clear()
})

afterEach(() => {
  jar.clear()
})

describe("session token", () => {
  it("mints a token that verifies back to the owner subject", async () => {
    const token = await createSessionToken()
    const payload = await verifySessionToken(token)
    expect(payload?.sub).toBe("owner")
  })

  it("rejects a tampered token", async () => {
    const token = await createSessionToken()
    const tampered = token.slice(0, -3) + "xyz"
    expect(await verifySessionToken(tampered)).toBeNull()
  })

  it("rejects an expired token", async () => {
    const expired = await createSessionToken(-10) // expired 10s ago
    expect(await verifySessionToken(expired)).toBeNull()
  })

  it("rejects garbage", async () => {
    expect(await verifySessionToken("not-a-jwt")).toBeNull()
  })
})

describe("session cookie + helpers", () => {
  it("setSessionCookie makes getSession return the owner session", async () => {
    expect(await getSession()).toBeNull()
    await setSessionCookie()
    const session = await getSession()
    expect(session?.sub).toBe("owner")
  })

  it("clearSessionCookie logs the owner out", async () => {
    await setSessionCookie()
    expect(await getSession()).not.toBeNull()
    await clearSessionCookie()
    expect(await getSession()).toBeNull()
  })

  it("requireOwner returns the session when present", async () => {
    await setSessionCookie()
    const session = await requireOwner()
    expect(session.sub).toBe("owner")
  })

  it("requireOwner throws UnauthorizedError when absent", async () => {
    await expect(requireOwner()).rejects.toBeInstanceOf(UnauthorizedError)
  })
})
