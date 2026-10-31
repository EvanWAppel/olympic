import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import {
  EXEMPT,
  checkResult,
  probeRoute,
  routeKey,
  runSmoke,
  smokeRoutes,
} from "@/lib/smoke-routes.mjs"
import { ACCESS_PATHS } from "@/lib/access"

type Route = ReturnType<typeof smokeRoutes>[number]

const APP_DIR = path.resolve(__dirname, "../../app")
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const

/**
 * Every (method, pattern) the App Router serves, read from src/app: pages,
 * route handlers (by exported method), opengraph images and robots.ts.
 */
function discoverAppRoutes(dir = APP_DIR, prefix = ""): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__") continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...discoverAppRoutes(full, `${prefix}/${entry.name}`))
      continue
    }
    const at = prefix || "/"
    if (entry.name === "page.tsx") out.push(routeKey("GET", at))
    if (entry.name === "opengraph-image.tsx") {
      out.push(routeKey("GET", `${prefix}/opengraph-image`))
    }
    if (entry.name === "robots.ts") out.push(routeKey("GET", "/robots.txt"))
    if (entry.name === "route.ts") {
      const src = readFileSync(full, "utf-8")
      for (const m of METHODS) {
        if (new RegExp(`export (async )?function ${m}\\b`).test(src)) {
          out.push(routeKey(m, at))
        }
      }
    }
  }
  return out
}

const NOW = new Date("2026-06-15T12:00:00Z")
const routes = smokeRoutes(NOW)

function find(method: string, pattern: string): Route[] {
  return routes.filter((r) => r.method === method && r.pattern === pattern)
}

function res(status: number, location?: string) {
  return new Response(null, { status, headers: location ? { location } : {} })
}

describe("smokeRoutes table", () => {
  it("covers every route the app serves (probed or explicitly exempt)", () => {
    const covered = new Set([
      ...routes.map((r) => routeKey(r.method, r.pattern)),
      ...EXEMPT.map((e) => routeKey(e.method, e.pattern)),
    ])
    const discovered = discoverAppRoutes()
    expect(discovered.length).toBeGreaterThan(20)
    const missing = discovered.filter((k) => !covered.has(k))
    expect(missing).toEqual([])
  })

  it("has no stale entries for routes the app no longer serves", () => {
    const discovered = new Set(discoverAppRoutes())
    // Static files in public/ aren't App Router routes.
    const stale = routes
      .filter((r) => !r.pattern.match(/\.(pdf|json)$/))
      .map((r) => routeKey(r.method, r.pattern))
      .filter((k) => !discovered.has(k))
    expect(stale).toEqual([])
    expect(EXEMPT.map((e) => routeKey(e.method, e.pattern)).filter((k) => !discovered.has(k))).toEqual(
      [],
    )
  })

  it("gives every exemption a reason", () => {
    for (const e of EXEMPT) expect(e.reason.length).toBeGreaterThan(10)
  })

  it("includes every route the 2026-10-10 incident and N7 named", () => {
    for (const p of ["/", "/about", "/recap", "/opengraph-image", "/resume.pdf", "/robots.txt"]) {
      expect(find("GET", p).every((r) => r.access === "public")).toBe(true)
      expect(find("GET", p).length).toBeGreaterThan(0)
    }
    expect(find("GET", "/login")[0]).toMatchObject({ access: "private", expect: 403 })
    expect(find("GET", "/settings")[0]).toMatchObject({ access: "private", expect: 403 })
    expect(find("GET", "/api/settings")[0]).toMatchObject({ access: "private", expect: 403 })
    expect(find("GET", "/api/health/secret")[0]).toMatchObject({ access: "private", expect: 403 })
    expect(find("GET", "/api/export")[0]).toMatchObject({ access: "private", expect: 403 })
    expect(find("POST", "/api/workouts")[0]).toMatchObject({ access: "private", expect: 401 })
    expect(find("POST", "/api/health/ingest").length).toBeGreaterThanOrEqual(2)
    expect(find("POST", "/api/health/ingest").every((r) => r.expect === 401)).toBe(true)
  })

  it("expects 200 from public routes and 401/403/307 from private ones", () => {
    for (const r of routes) {
      if (r.access === "private") expect([401, 403, 307]).toContain(r.expect)
      else expect([200, 307, 404]).toContain(r.expect)
    }
    // The public GET of the workout list stays public (PRD: notes preview).
    expect(find("GET", "/api/workouts")[0]).toMatchObject({ access: "public", expect: 200 })
  })

  it("expects 403 from every route under the Cloudflare Access app (no Access token)", () => {
    for (const r of routes) {
      const underAccess = ACCESS_PATHS.some((p) => r.path === p || r.path.startsWith(`${p}/`))
      if (underAccess) expect(r, routeKey(r.method, r.pattern)).toMatchObject({ access: "private", expect: 403 })
    }
  })

  it("probes the current year's recap", () => {
    expect(find("GET", "/recap/[year]")[0].path).toBe("/recap/2026")
    expect(find("GET", "/recap/[year]/opengraph-image")[0].path).toBe("/recap/2026/opengraph-image")
  })

  it("never sends a body that could mutate data if a guard were missing", () => {
    for (const r of routes.filter((x) => x.method !== "GET")) {
      // No confirm header for DELETE /api/all-data, invalid or empty payloads elsewhere.
      expect(r.headers?.["x-confirm-delete"]).toBeUndefined()
      if (r.body !== undefined) expect(r.body).toBe("{}")
    }
    expect(find("DELETE", "/api/workouts/[id]")[0].path).toMatch(/00000000-0000-0000-0000-000000000000/)
  })
})

describe("checkResult", () => {
  const pub = { method: "GET", pattern: "/", path: "/", access: "public", expect: 200 } as Route
  const priv = { method: "GET", pattern: "/api/settings", path: "/api/settings", access: "private", expect: 401 } as Route
  const redir = { method: "GET", pattern: "/settings", path: "/settings", access: "private", expect: 307, location: "/login" } as Route

  it("passes on the expected status", () => {
    expect(checkResult(pub, { status: 200 }).ok).toBe(true)
    expect(checkResult(priv, { status: 401 }).ok).toBe(true)
  })

  it("flags a private route that answers 2xx as EXPOSED", () => {
    const r = checkResult(priv, { status: 200 })
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/EXPOSED/)
  })

  it("fails a public route that doesn't answer 200", () => {
    const r = checkResult(pub, { status: 500 })
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/500/)
  })

  it("checks the redirect target, absolute or relative", () => {
    expect(checkResult(redir, { status: 307, location: "/login" }).ok).toBe(true)
    expect(checkResult(redir, { status: 307, location: "http://localhost:3000/login" }).ok).toBe(true)
    expect(checkResult(redir, { status: 307, location: "/settings/x" }).ok).toBe(false)
    expect(checkResult(redir, { status: 307 }).ok).toBe(false)
  })

  it("matches the redirect target on a path boundary, not a raw prefix", () => {
    expect(checkResult(redir, { status: 307, location: "/login?next=%2Fsettings" }).ok).toBe(true)
    expect(checkResult(redir, { status: 307, location: "/login/" }).ok).toBe(true)
    expect(checkResult(redir, { status: 307, location: "/login-elsewhere" }).ok).toBe(false)
    expect(checkResult(redir, { status: 307, location: "/loginx" }).ok).toBe(false)
    const recap = find("GET", "/recap")[0]
    expect(checkResult(recap, { status: 307, location: "/recap/2026" }).ok).toBe(true)
  })
})

describe("probeRoute", () => {
  it("sends the method without following redirects and reports status + location", async () => {
    const fetchImpl = vi.fn(async () => res(307, "/recap/2026"))
    const route = find("GET", "/recap")[0]
    const r = await probeRoute("http://localhost:3000/", route, fetchImpl)
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/recap",
      expect.objectContaining({ method: "GET", redirect: "manual" }),
    )
    expect(r).toMatchObject({ ok: true, status: 307 })
  })

  it("never sends cookies or credentials", async () => {
    let init: RequestInit = {}
    const fetchImpl = vi.fn(async (_: string, i?: RequestInit) => {
      init = i ?? {}
      return res(401)
    })
    await probeRoute("http://x.test", find("POST", "/api/workouts")[0], fetchImpl)
    const headers = new Headers(init.headers)
    expect(headers.get("cookie")).toBeNull()
    expect(init.credentials).toBe("omit")
  })

  it("reports a network error as a failure, not a throw", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED")
    })
    const r = await probeRoute("http://x.test", find("GET", "/")[0], fetchImpl)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/ECONNREFUSED/)
  })
})

describe("runSmoke", () => {
  function fakeServer(override: Record<string, number> = {}) {
    return vi.fn(async (url: string, init?: RequestInit) => {
      const p = new URL(url).pathname
      const key = `${init?.method ?? "GET"} ${p}`
      if (key in override) return res(override[key])
      const route = routes.find((r) => r.path === p && r.method === (init?.method ?? "GET"))!
      return res(route.expect, route.location)
    })
  }

  it("exits 0 when every route answers as expected", async () => {
    const r = await runSmoke({ baseUrl: "http://x.test", fetchImpl: fakeServer(), now: NOW })
    expect(r.exitCode).toBe(0)
    expect(r.lines.length).toBe(routes.length + 1)
  })

  it("exits 1 and names the route when a private route is exposed", async () => {
    const r = await runSmoke({
      baseUrl: "http://x.test",
      fetchImpl: fakeServer({ "GET /api/settings": 200 }),
      now: NOW,
    })
    expect(r.exitCode).toBe(1)
    expect(r.lines.join("\n")).toMatch(/FAIL.*GET \/api\/settings.*EXPOSED/)
  })
})
