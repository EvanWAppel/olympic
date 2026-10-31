import { NextResponse } from "next/server"
import { requireAccessOr403 } from "@/lib/access"
import { clearSessionCookie } from "@/lib/session"

export const runtime = "nodejs"

export async function POST() {
  const noAccess = await requireAccessOr403()
  if (noAccess) return noAccess

  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
