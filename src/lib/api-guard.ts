import { NextResponse } from "next/server"
import { getSession } from "./session"

/**
 * Guard clause for owner-only route handlers. Returns a `401` response when
 * there is no valid owner session, or `null` when the caller is the owner
 * (proceed). Works with any handler signature, unlike a wrapper:
 *
 *   export async function POST(req: Request) {
 *     const denied = await requireOwnerOr401()
 *     if (denied) return denied
 *     // ...owner-only work
 *   }
 *
 * The public read surface (dashboard aggregates, workout list GET) is left
 * unguarded on purpose — see PRD §6 access map.
 */
export async function requireOwnerOr401(): Promise<NextResponse | null> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  return null
}
