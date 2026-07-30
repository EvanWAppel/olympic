import { NextResponse } from "next/server"
import { z } from "zod"
import {
  deleteWorkout,
  getWorkout,
  updateWorkout,
  type WorkoutUpdate,
} from "@/db/workouts.repo"
import { getSettings } from "@/db/settings.repo"
import { daysBetween, localDateKey } from "@/lib/dates"

const PatchSchema = z.object({
  minutes: z.number().positive().max(600).optional(),
  speedMph: z.number().positive().max(20).optional(),
  inclinePct: z.number().min(0).max(30).optional(),
  distanceMi: z.number().nonnegative().max(100).optional(),
  steps: z.number().int().nonnegative().max(1_000_000).optional(),
  calories: z.number().nonnegative().max(10_000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const d = parsed.data
  const patch: WorkoutUpdate = {}
  if (d.minutes !== undefined) patch.minutes = d.minutes.toString()
  if (d.speedMph !== undefined) patch.speedMph = d.speedMph.toString()
  if (d.inclinePct !== undefined) patch.inclinePct = d.inclinePct.toString()
  if (d.distanceMi !== undefined) patch.distanceMi = d.distanceMi.toFixed(3)
  if (d.steps !== undefined) patch.steps = d.steps
  if (d.calories !== undefined) patch.calories = d.calories.toFixed(2)
  if (d.notes !== undefined) patch.notes = d.notes

  // If the date or duration changed, recompute start/end. Keep the original
  // time-of-day by shifting whole days, so a backdated workout stays on its day.
  if (d.date !== undefined || d.minutes !== undefined) {
    const existing = await getWorkout(id)
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const { timezone } = await getSettings()
    const currentKey = localDateKey(existing.endAt, timezone)
    const targetKey = d.date ?? currentKey
    const dayShift = daysBetween(currentKey, targetKey)

    const endAt = new Date(existing.endAt.getTime() + dayShift * 86_400_000)
    patch.endAt = endAt
    patch.startAt =
      d.minutes !== undefined
        ? new Date(endAt.getTime() - d.minutes * 60_000)
        : new Date(existing.startAt.getTime() + dayShift * 86_400_000)
  }

  const row = await updateWorkout(id, patch)
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const ok = await deleteWorkout(id)
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}
