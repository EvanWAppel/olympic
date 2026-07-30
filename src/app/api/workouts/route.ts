import { NextResponse } from "next/server"
import { z } from "zod"
import { createWorkout, listWorkouts } from "@/db/workouts.repo"
import { getSettings } from "@/db/settings.repo"
import { daysBetween, localDateKey } from "@/lib/dates"

const InputSchema = z.object({
  speedMph: z.number().positive().max(20),
  inclinePct: z.number().min(0).max(30),
  minutes: z.number().positive().max(600),
  distanceMi: z.number().nonnegative().max(100),
  steps: z.number().int().nonnegative().max(1_000_000),
  calories: z.number().nonnegative().max(10_000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(2000).optional(),
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

  const { speedMph, inclinePct, minutes, distanceMi, steps, calories, date, notes } =
    parsed.data

  // Default to "now"; when a date is supplied, shift back to that calendar day
  // (in the owner's timezone) while keeping the current time-of-day.
  const now = new Date()
  let endAt = now
  if (date) {
    const { timezone } = await getSettings()
    const daysBack = daysBetween(date, localDateKey(now, timezone))
    if (daysBack < 0) {
      return NextResponse.json({ error: "future_date" }, { status: 400 })
    }
    endAt = new Date(now.getTime() - daysBack * 86_400_000)
  }
  const startAt = new Date(endAt.getTime() - minutes * 60_000)

  const row = await createWorkout({
    source: "treadmill",
    startAt,
    endAt,
    minutes: minutes.toString(),
    speedMph: speedMph.toString(),
    inclinePct: inclinePct.toString(),
    distanceMi: distanceMi.toFixed(3),
    steps,
    calories: calories.toFixed(2),
    notes: notes ?? null,
  })

  return NextResponse.json(row, { status: 201 })
}

export async function GET() {
  const rows = await listWorkouts()
  return NextResponse.json(rows)
}
