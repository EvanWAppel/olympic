import { NextResponse } from "next/server"
import { z } from "zod"
import { getMood, upsertMood } from "@/db/mood.repo"
import { getSettings } from "@/db/settings.repo"
import { requireOwnerOr401 } from "@/lib/api-guard"
import { localDateKey } from "@/lib/dates"

const InputSchema = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().max(2000).optional(),
})

// Owner-only write (PRD §3: no public write of any kind). Mood is also
// sensitive mental-health data, so it must never be settable by the public.
export async function POST(req: Request) {
  const denied = await requireOwnerOr401()
  if (denied) return denied

  const json = await req.json().catch(() => null)
  const parsed = InputSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { score, comment } = parsed.data
  // The check-in always lands on "today" in the user's timezone.
  const { timezone } = await getSettings()
  const date = localDateKey(new Date(), timezone)

  const row = await upsertMood({ date, score, comment: comment ?? null })
  return NextResponse.json(row, { status: 201 })
}

export async function GET() {
  const { timezone } = await getSettings()
  const date = localDateKey(new Date(), timezone)
  const row = await getMood(date)
  return NextResponse.json(row)
}
