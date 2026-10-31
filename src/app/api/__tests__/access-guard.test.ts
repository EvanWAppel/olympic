// @vitest-environment node
import { describe, expect, it, vi } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { NextResponse } from "next/server"

// Every route handler under the Cloudflare Access app checks Access itself,
// before anything else (gatekeeper-ts README: the proxy matcher alone is not
// enough for anything that changes state). Here Access always says no, while
// the passkey session says yes: the handler must still refuse.
const denied = NextResponse.json({ error: "forbidden" }, { status: 403 })
vi.mock("@/lib/access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/access")>()),
  requireAccessOr403: vi.fn(async () => denied),
}))
// No database: a handler that got past the Access check would fail on this.
vi.mock("@/db/client", () => ({ db: {} }))
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ sub: "owner" })),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}))

import { ACCESS_PATHS } from "@/lib/access"
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/session"

const API_DIR = path.resolve(__dirname, "..")
const JSON_BODY = { headers: { "content-type": "application/json" }, body: "{}" }

type Handler = (req: Request, ctx?: unknown) => Promise<Response>
type Case = [route: string, method: string, load: () => Promise<Handler>]

const cases: Case[] = [
  ["/api/auth/login/options", "POST", async () => (await import("../auth/login/options/route")).POST],
  ["/api/auth/login/verify", "POST", async () => (await import("../auth/login/verify/route")).POST],
  ["/api/auth/register/options", "POST", async () => (await import("../auth/register/options/route")).POST],
  ["/api/auth/register/verify", "POST", async () => (await import("../auth/register/verify/route")).POST],
  ["/api/auth/logout", "POST", async () => (await import("../auth/logout/route")).POST as Handler],
  ["/api/settings", "GET", async () => (await import("../settings/route")).GET as Handler],
  ["/api/settings", "PATCH", async () => (await import("../settings/route")).PATCH],
  ["/api/health/secret", "GET", async () => (await import("../health/secret/route")).GET as Handler],
  ["/api/health/secret", "POST", async () => (await import("../health/secret/route")).POST as Handler],
  ["/api/export", "GET", async () => (await import("../export/route")).GET as Handler],
  ["/api/all-data", "DELETE", async () => (await import("../all-data/route")).DELETE],
  ["/api/health/import", "POST", async () => (await import("../health/import/route")).POST],
  ["/api/health/blob-upload", "POST", async () => (await import("../health/blob-upload/route")).POST],
]

describe("route handlers under the Access app", () => {
  it.each(cases)("%s %s refuses without Access even with a passkey session", async (route, method, load) => {
    const handler = await load()
    const init = method === "GET" ? { method } : { method, ...JSON_BODY }
    vi.mocked(getSession).mockClear()
    vi.mocked(setSessionCookie).mockClear()
    vi.mocked(clearSessionCookie).mockClear()
    const req = new Request(`http://localhost${route}`, init)
    const res = await handler(req)
    expect(res).toBe(denied)
    // The Access check runs first: nothing else happened.
    expect(getSession).not.toHaveBeenCalled()
    expect(setSessionCookie).not.toHaveBeenCalled()
    expect(clearSessionCookie).not.toHaveBeenCalled()
    expect(req.bodyUsed).toBe(false)
  })

  /** Every exported handler in every route.ts at or below `dir`. */
  function handlersUnder(dir: string): { file: string; methods: string[] }[] {
    return readdirSync(dir, { recursive: true, encoding: "utf8" })
      .filter((f) => f.endsWith("route.ts") && !f.includes("__tests__"))
      .map((f) => {
        const src = readFileSync(path.join(dir, f), "utf8")
        const methods = [
          ...src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g),
        ].map((m) => m[1])
        // Re-exports (`export { GET } from …`) would dodge the scan above.
        expect(src, f).not.toMatch(/export\s*\{[^}]*\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/)
        return { file: path.join(dir, f), methods }
      })
  }

  it("covers every handler on the Access paths (a new one must be added above)", () => {
    const apiPaths = ACCESS_PATHS.filter((p) => p.startsWith("/api/"))
    const found = apiPaths.flatMap((p) => {
      const dir = path.join(API_DIR, p.slice("/api/".length))
      return handlersUnder(dir).flatMap(({ file, methods }) => {
        const route = "/api/" + path.relative(API_DIR, path.dirname(file))
        return methods.map((m) => `${route} ${m}`)
      })
    })
    expect(found.sort()).toEqual(cases.map(([r, m]) => `${r} ${m}`).sort())
  })

  it.each(["login", "settings"])("the /%s page has no Server Actions (they would bypass the handler checks)", (dir) => {
    const appDir = path.resolve(API_DIR, "..", dir)
    for (const f of readdirSync(appDir, { recursive: true, encoding: "utf8" })) {
      if (!/\.(t|j)sx?$/.test(f)) continue
      expect(readFileSync(path.join(appDir, f), "utf8"), f).not.toMatch(/["']use server["']/)
    }
  })

  it.each(["health/ingest", "workouts", "mood", "version"])(
    "/api/%s does not require Access (iPhone ingest; dashboard writes stay passkey-only)",
    (dir) => {
      for (const { file } of handlersUnder(path.join(API_DIR, dir))) {
        expect(readFileSync(file, "utf8")).not.toContain("@/lib/access")
      }
    },
  )
})
