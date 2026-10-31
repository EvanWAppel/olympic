import { NextResponse, type NextRequest } from "next/server"
import { getAccessVerifier } from "@/lib/access"

/**
 * Cloudflare Access gate for the Access app's paths (ACCESS_PATHS in
 * src/lib/access.ts — a test keeps the matcher in step with it). Only a
 * request that came through Cloudflare carries a valid token, so this also
 * shuts the *.vercel.app origin out of these paths. Route handlers check again
 * themselves: the matcher is not enough for anything that changes state.
 */
export async function proxy(request: NextRequest) {
  const identity = await getAccessVerifier().fromHeaders(request.headers)
  if (!identity) {
    console.warn(`[access] 403 ${request.method} ${request.nextUrl.pathname}`)
    return new NextResponse("Forbidden", { status: 403 })
  }
  return NextResponse.next()
}

// Must be literals (Next reads them statically).
export const config = {
  matcher: [
    "/login/:path*",
    "/settings/:path*",
    "/api/auth/:path*",
    "/api/settings/:path*",
    "/api/health/secret/:path*",
    "/api/export/:path*",
    "/api/all-data/:path*",
    "/api/health/import/:path*",
    "/api/health/blob-upload/:path*",
  ],
}
