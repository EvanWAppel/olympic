// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server"

const fromHeaders = vi.fn()
vi.mock("@/lib/access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/access")>()),
  getAccessVerifier: () => ({ fromHeaders }),
}))

import { config, proxy } from "../proxy"
import { ACCESS_PATHS } from "@/lib/access"

const matches = (url: string) =>
  unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })

beforeEach(() => {
  fromHeaders.mockReset()
})

describe("proxy matcher", () => {
  it.each(ACCESS_PATHS)("guards %s and everything under it", (path) => {
    expect(matches(path)).toBe(true)
    expect(matches(`${path}/x/y`)).toBe(true)
  })

  it.each([
    "/",
    "/api/health/ingest", // iPhone posts here with a Bearer token, no Cloudflare sign-in
    "/api/workouts", // public GET; writes stay passkey-only (DECISIONS 2026-10-31)
    "/api/workouts/abc",
    "/api/mood",
    "/api/version",
    "/demo",
    "/loginx", // prefix lookalikes are not the Access app's paths
    "/settingsx",
    "/api/authx",
  ])("leaves %s alone", (path) => {
    expect(matches(path)).toBe(false)
  })
})

describe("proxy", () => {
  it("403s a request with no valid Access identity, and logs it", async () => {
    // Next patches console in a way that needs its request storage; stub it.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    fromHeaders.mockResolvedValue(null)
    const req = new NextRequest("https://olympic.test/settings")
    const res = await proxy(req)
    expect(res.status).toBe(403)
    expect(fromHeaders).toHaveBeenCalledWith(req.headers)
    expect(warn).toHaveBeenCalledWith("[access] 403 GET /settings")
    warn.mockRestore()
  })

  it("lets a verified Access identity through", async () => {
    fromHeaders.mockResolvedValue({ email: "owner@example.com", subject: "s" })
    const res = await proxy(new NextRequest("https://olympic.test/settings"))
    expect(res.status).toBe(200)
    expect(res.headers.get("x-middleware-next")).toBe("1")
  })
})
