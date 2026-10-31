// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// The verifier itself is gatekeeper-ts's job (it carries its own tests); here
// we only check how olympic wires it: env → one shared verifier, and the
// guard clause turning "no identity" into a 403.
const fromHeaders = vi.fn()
const ctor = vi.fn()
vi.mock("gatekeeper-ts", () => ({
  AccessVerifier: class {
    constructor(options: unknown) {
      ctor(options)
    }
    fromHeaders = fromHeaders
    check = vi.fn()
  },
}))

const requestHeaders = new Headers()
vi.mock("next/headers", () => ({ headers: vi.fn(async () => requestHeaders) }))

const TEAM = "https://example-team.cloudflareaccess.com"
const AUD = "test-audience-tag"

beforeEach(() => {
  vi.resetModules()
  ctor.mockClear()
  fromHeaders.mockReset()
  vi.stubEnv("CF_ACCESS_TEAM_DOMAIN", TEAM)
  vi.stubEnv("CF_ACCESS_AUD", AUD)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("getAccessVerifier", () => {
  it("builds one verifier from CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD", async () => {
    const { getAccessVerifier } = await import("../access")
    const a = getAccessVerifier()
    const b = getAccessVerifier()
    expect(a).toBe(b)
    expect(ctor).toHaveBeenCalledTimes(1)
    expect(ctor).toHaveBeenCalledWith({ teamDomain: TEAM, audience: AUD })
  })

  it.each(["CF_ACCESS_TEAM_DOMAIN", "CF_ACCESS_AUD"])(
    "throws when %s is unset, instead of failing open",
    async (name) => {
      vi.stubEnv(name, "")
      const { getAccessVerifier } = await import("../access")
      expect(() => getAccessVerifier()).toThrow(name)
      expect(ctor).not.toHaveBeenCalled()
    },
  )
})

describe("requireAccessOr403", () => {
  it("returns 403 when the request carries no valid Access identity", async () => {
    fromHeaders.mockResolvedValue(null)
    const { requireAccessOr403 } = await import("../access")
    const res = await requireAccessOr403()
    expect(res?.status).toBe(403)
    expect(fromHeaders).toHaveBeenCalledWith(requestHeaders)
  })

  it("returns null (proceed) for a verified Access identity", async () => {
    fromHeaders.mockResolvedValue({ email: "owner@example.com", subject: "s" })
    const { requireAccessOr403 } = await import("../access")
    expect(await requireAccessOr403()).toBeNull()
  })
})

describe("checkAccessAtStartup", () => {
  it("logs loudly and does not throw when the env is missing", async () => {
    vi.stubEnv("CF_ACCESS_AUD", "")
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const { checkAccessAtStartup } = await import("../access")
    await expect(checkAccessAtStartup()).resolves.toBe(false)
    expect(error).toHaveBeenCalled()
    expect(String(error.mock.calls[0][0])).toMatch(/Cloudflare Access/)
    error.mockRestore()
  })
})

describe("ACCESS_PATHS", () => {
  it("is exactly the Access app's 9 paths, and never the iPhone ingest path", async () => {
    const { ACCESS_PATHS } = await import("../access")
    expect([...ACCESS_PATHS].sort()).toEqual(
      [
        "/login",
        "/settings",
        "/api/auth",
        "/api/settings",
        "/api/health/secret",
        "/api/export",
        "/api/all-data",
        "/api/health/import",
        "/api/health/blob-upload",
      ].sort(),
    )
    expect(ACCESS_PATHS).not.toContain("/api/health/ingest")
  })
})
