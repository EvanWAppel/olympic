// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"

const SHA = "0123456789abcdef0123456789abcdef01234567"

async function loadGET() {
  vi.resetModules()
  return (await import("../route")).GET
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("GET /api/version", () => {
  it("returns the build commit and nothing else", async () => {
    vi.stubEnv("BUILD_COMMIT", SHA)
    const res = await (await loadGET())()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ commit: SHA })
  })

  it("reports 'unknown' when no commit was embedded", async () => {
    vi.stubEnv("BUILD_COMMIT", "")
    const res = await (await loadGET())()
    expect(await res.json()).toEqual({ commit: "unknown" })
  })

  it("is public: no session is consulted", async () => {
    vi.stubEnv("BUILD_COMMIT", SHA)
    vi.doMock("@/lib/session", () => ({
      getSession: vi.fn(() => {
        throw new Error("version must not touch the session")
      }),
    }))
    const res = await (await loadGET())()
    expect(res.status).toBe(200)
    vi.doUnmock("@/lib/session")
  })

  it("is not cached by the CDN", async () => {
    vi.stubEnv("BUILD_COMMIT", SHA)
    const res = await (await loadGET())()
    expect(res.headers.get("cache-control")).toContain("no-store")
  })
})
