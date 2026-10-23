// Anonymous smoke probe for scripts/smoke-anon.mjs (N7 automation, and the
// 2026-10-10 incident follow-up: every prod smoke test includes an anonymous
// probe of the private routes). Plain ESM + JSDoc so the CLI runs under bare
// `node` and vitest can import it (fetch is injectable).
//
// The table must cover every route the app serves; a unit test walks src/app
// and fails when a page or route handler is neither probed nor in EXEMPT.
//
// Safety: requests carry no cookies, and every non-GET body is empty or `{}`.
// If a guard ever went missing, a probe still couldn't write anything: the
// payloads fail validation, DELETE /api/all-data lacks its confirm header, and
// the workout id doesn't exist.

/**
 * @typedef {{
 *   method: "GET" | "POST" | "PATCH" | "DELETE",
 *   pattern: string,
 *   path: string,
 *   access: "public" | "private",
 *   expect: number,
 *   location?: string,
 *   headers?: Record<string, string>,
 *   body?: string,
 *   note?: string,
 * }} SmokeRoute
 */
/** @typedef {{ status?: number, location?: string | null }} Observed */
/** @typedef {(url: string, init?: RequestInit) => Promise<Response>} FetchLike */

const NO_SUCH_ID = "00000000-0000-0000-0000-000000000000"
const JSON_HEADERS = { "content-type": "application/json" }

/**
 * @param {string} method
 * @param {string} pattern
 */
export const routeKey = (method, pattern) => `${method} ${pattern}`

/**
 * Routes deliberately not probed, each with the reason.
 * @type {{ method: string, pattern: string, reason: string }[]}
 */
export const EXEMPT = [
  {
    method: "POST",
    pattern: "/api/auth/login/options",
    reason: "public by design (starts the passkey login) and writes a challenge row on every call",
  },
  {
    method: "POST",
    pattern: "/api/auth/login/verify",
    reason: "public by design (finishes the passkey login); a probe could consume an in-flight owner login's challenge",
  },
]

/**
 * The probe table. `now` picks the recap year so the dynamic recap routes hit
 * a year that exists.
 * @param {Date} [now]
 * @returns {SmokeRoute[]}
 */
export function smokeRoutes(now = new Date()) {
  const year = now.getFullYear()
  /** @type {(method: SmokeRoute["method"], pattern: string, extra?: Partial<SmokeRoute>) => SmokeRoute} */
  const pub = (method, pattern, extra = {}) => ({
    method,
    pattern,
    path: pattern,
    access: "public",
    expect: 200,
    ...extra,
  })
  /** @type {(method: SmokeRoute["method"], pattern: string, expect: number, extra?: Partial<SmokeRoute>) => SmokeRoute} */
  const priv = (method, pattern, expect, extra = {}) => ({
    method,
    pattern,
    path: pattern,
    access: "private",
    expect,
    ...extra,
  })
  const emptyJson = { headers: JSON_HEADERS, body: "{}" }

  return [
    // Public pages and assets.
    pub("GET", "/"),
    pub("GET", "/about"),
    pub("GET", "/changelog"),
    pub("GET", "/demo"),
    pub("GET", "/login"),
    pub("GET", "/recap", { expect: 307, location: "/recap/", note: "redirects to the newest year" }),
    pub("GET", "/recap/[year]", { path: `/recap/${year}` }),
    pub("GET", "/opengraph-image"),
    pub("GET", "/recap/[year]/opengraph-image", { path: `/recap/${year}/opengraph-image` }),
    pub("GET", "/robots.txt"),
    pub("GET", "/resume.pdf"),
    pub("GET", "/manifest.json"),
    // Public API.
    pub("GET", "/api/workouts", { note: "public list incl. notes preview (PRD §6)" }),
    pub("GET", "/api/version"),
    pub("POST", "/api/auth/logout", { note: "clears the caller's own cookie only" }),

    // Private pages.
    priv("GET", "/settings", 307, { location: "/login" }),
    // Private API: owner session required.
    priv("GET", "/api/settings", 401),
    priv("PATCH", "/api/settings", 401, emptyJson),
    priv("GET", "/api/health/secret", 401),
    priv("POST", "/api/health/secret", 401),
    priv("GET", "/api/export", 401),
    priv("POST", "/api/workouts", 401, emptyJson),
    priv("PATCH", "/api/workouts/[id]", 401, { path: `/api/workouts/${NO_SUCH_ID}`, ...emptyJson }),
    priv("DELETE", "/api/workouts/[id]", 401, { path: `/api/workouts/${NO_SUCH_ID}` }),
    priv("DELETE", "/api/all-data", 401, { note: "no x-confirm-delete header" }),
    priv("GET", "/api/mood", 401),
    priv("POST", "/api/mood", 401, emptyJson),
    priv("POST", "/api/health/import", 401),
    priv("POST", "/api/health/blob-upload", 401, emptyJson),
    // Ingest: bearer secret required.
    priv("POST", "/api/health/ingest", 401, { ...emptyJson, note: "no Authorization header" }),
    priv("POST", "/api/health/ingest", 401, {
      headers: { ...JSON_HEADERS, authorization: "Bearer smoke-probe-not-the-secret" },
      body: "{}",
      note: "wrong bearer secret",
    }),
    // Passkey registration: bootstrap secret required.
    priv("POST", "/api/auth/register/options", 403, emptyJson),
    priv("POST", "/api/auth/register/verify", 403, emptyJson),
  ]
}

/**
 * @param {SmokeRoute} route
 * @param {Observed} observed
 * @returns {{ ok: boolean, reason: string }}
 */
export function checkResult(route, observed) {
  const { status } = observed
  if (status === route.expect) {
    if (route.location === undefined) return { ok: true, reason: `${status}` }
    const loc = observed.location ?? ""
    let target = loc
    try {
      target = new URL(loc, "http://smoke.invalid").pathname
    } catch {
      // keep the raw value
    }
    // Match on a path boundary: "/login" accepts "/login" and "/login/..." but
    // not "/login-elsewhere"; "/recap/" accepts "/recap/2026".
    const want = route.location
    const ok =
      loc !== "" &&
      (target === want || target.startsWith(want.endsWith("/") ? want : `${want}/`))
    return {
      ok,
      reason: ok ? `${status} → ${target}` : `${status} → ${loc || "(no location)"}, expected → ${route.location}`,
    }
  }
  if (route.access === "private" && status !== undefined && status >= 200 && status < 300) {
    return { ok: false, reason: `EXPOSED: anonymous request got ${status}, expected ${route.expect}` }
  }
  return { ok: false, reason: `got ${status}, expected ${route.expect}` }
}

/**
 * @param {string} baseUrl
 * @param {SmokeRoute} route
 * @param {FetchLike} [fetchImpl]
 * @returns {Promise<{ ok: boolean, reason: string, status?: number }>}
 */
export async function probeRoute(baseUrl, route, fetchImpl = fetch) {
  const url = `${baseUrl.replace(/\/+$/, "")}${route.path}`
  try {
    const res = await fetchImpl(url, {
      method: route.method,
      redirect: "manual",
      credentials: "omit",
      cache: "no-store",
      headers: route.headers ?? {},
      body: route.body,
    })
    // Drain so keep-alive sockets don't pile up.
    await res.arrayBuffer().catch(() => undefined)
    const observed = { status: res.status, location: res.headers.get("location") }
    return { ...checkResult(route, observed), status: res.status }
  } catch (err) {
    return { ok: false, reason: `request failed: ${err instanceof Error ? err.message : err}` }
  }
}

/**
 * Probes every route in order. Exit code 0 when all match, 1 otherwise.
 * @param {{ baseUrl: string, fetchImpl?: FetchLike, now?: Date }} opts
 * @returns {Promise<{ exitCode: 0 | 1, lines: string[] }>}
 */
export async function runSmoke({ baseUrl, fetchImpl = fetch, now = new Date() }) {
  const routes = smokeRoutes(now)
  const lines = []
  let failures = 0
  for (const route of routes) {
    const r = await probeRoute(baseUrl, route, fetchImpl)
    if (!r.ok) failures++
    const label = `${route.method} ${route.path}`.padEnd(48)
    lines.push(`${r.ok ? "ok  " : "FAIL"}  ${route.access.padEnd(7)}  ${label}  ${r.reason}`)
  }
  lines.push(
    failures === 0
      ? `All ${routes.length} anonymous probes passed against ${baseUrl}.`
      : `${failures} of ${routes.length} anonymous probes FAILED against ${baseUrl}.`,
  )
  return { exitCode: failures === 0 ? 0 : 1, lines }
}
