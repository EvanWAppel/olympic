import { NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getSettings, updateSettings } from "@/db/settings.repo"
import { requireOwnerOr401 } from "@/lib/api-guard"

export const runtime = "nodejs"

// Owner-only. Previously returned the ingest secret to any caller — the hole
// flagged in the 2026-06-24 portfolio audit (PRD §13). Now behind the session.
export async function GET() {
  const denied = await requireOwnerOr401()
  if (denied) return denied

  const s = await getSettings()
  return NextResponse.json({ secret: s.healthIngestSecret })
}

export async function POST() {
  const denied = await requireOwnerOr401()
  if (denied) return denied

  const newSecret = randomBytes(24).toString("base64url")
  await updateSettings({ healthIngestSecret: newSecret })
  return NextResponse.json({ secret: newSecret })
}
