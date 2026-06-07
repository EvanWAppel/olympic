import { NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getSettings, updateSettings } from "@/db/settings.repo"

export const runtime = "nodejs"

export async function GET() {
  const s = await getSettings()
  return NextResponse.json({ secret: s.healthIngestSecret })
}

export async function POST() {
  const newSecret = randomBytes(24).toString("base64url")
  await updateSettings({ healthIngestSecret: newSecret })
  return NextResponse.json({ secret: newSecret })
}
