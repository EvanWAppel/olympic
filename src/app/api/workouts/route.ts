import { NextResponse } from "next/server"
import { z } from "zod"
import { createWorkout, listWorkouts } from "@/db/workouts.repo"

const InputSchema = z.object({
  speedMph: z.number().positive().max(20),
  inclinePct: z.number().min(0).max(30),
  minutes: z.number().positive().max(600),
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

  const { speedMph, inclinePct, minutes } = parsed.data
  const distanceMi = speedMph * (minutes / 60)
  const endAt = new Date()
  const startAt = new Date(endAt.getTime() - minutes * 60_000)

  const row = await createWorkout({
    startAt,
    endAt,
    minutes: minutes.toString(),
    speedMph: speedMph.toString(),
    inclinePct: inclinePct.toString(),
    distanceMi: distanceMi.toFixed(3),
  })

  return NextResponse.json(row, { status: 201 })
}

export async function GET() {
  const rows = await listWorkouts()
  return NextResponse.json(rows)
}
