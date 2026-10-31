import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { AccessVerifier } from "gatekeeper-ts"

/**
 * The Cloudflare Access app's paths, each guarding everything under it. Keep
 * this list, the `matcher` in src/proxy.ts and the Access app in step: a path
 * in one and not the others is either unguarded by the app or unreachable
 * through Cloudflare. `/api/health/ingest` is deliberately absent — the iPhone
 * posts there with a Bearer token and no Cloudflare sign-in. Workout and mood
 * writes stay passkey-only because the public dashboard calls them
 * (DECISIONS 2026-10-31).
 */
export const ACCESS_PATHS = [
  "/login",
  "/settings",
  "/api/auth",
  "/api/settings",
  "/api/health/secret",
  "/api/export",
  "/api/all-data",
  "/api/health/import",
  "/api/health/blob-upload",
] as const

let verifier: AccessVerifier | undefined

/**
 * One shared verifier, built on first use from CF_ACCESS_TEAM_DOMAIN and
 * CF_ACCESS_AUD. Throws when either is unset, so a missing env var fails
 * closed (every guarded request errors) instead of quietly letting anyone in.
 */
export function getAccessVerifier(): AccessVerifier {
  if (verifier) return verifier
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN
  const audience = process.env.CF_ACCESS_AUD
  if (!teamDomain) throw new Error("CF_ACCESS_TEAM_DOMAIN is not set")
  if (!audience) throw new Error("CF_ACCESS_AUD is not set")
  verifier = new AccessVerifier({ teamDomain, audience })
  return verifier
}

/**
 * Guard clause for route handlers under the Access app, run before the
 * passkey check (gatekeeper-ts README: the proxy matcher alone isn't enough
 * for anything that changes state). Returns a `403` response when the request
 * carries no valid Access token, or `null` to proceed.
 */
export async function requireAccessOr403(): Promise<NextResponse | null> {
  const identity = await getAccessVerifier().fromHeaders(await headers())
  if (!identity) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  return null
}

/**
 * Startup check (src/instrumentation.ts). Without it, a bad team domain, AUD
 * or unreachable key set looks exactly like "nobody is signed in". Logs loudly
 * and returns false rather than crashing the server, so the public dashboard
 * keeps serving while the Access-guarded paths fail closed.
 */
export async function checkAccessAtStartup(): Promise<boolean> {
  try {
    await getAccessVerifier().check()
    console.info("[access] Cloudflare Access verifier ready")
    return true
  } catch (err) {
    console.error(
      "[access] Cloudflare Access verifier FAILED its startup check — every Access-guarded path will 403:",
      err,
    )
    return false
  }
}
