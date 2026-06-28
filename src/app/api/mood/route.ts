import { NextResponse } from "next/server"
import { z } from "zod"
import { createMoodCheckin, listMoodCheckins } from "@/db/mood.repo"

const InputSchema = z.object({
  score: z.number().int().min(1).max(10),
  comment: z.string().max(2000).optional(),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = InputSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { score, comment } = parsed.data
  const trimmed = comment?.trim()

  const row = await createMoodCheckin({
    score,
    comment: trimmed ? trimmed : null,
  })

  return NextResponse.json(row, { status: 201 })
}

export async function GET() {
  const rows = await listMoodCheckins()
  return NextResponse.json(rows)
}
