import { NextResponse } from "next/server"
import { z } from "zod"
import { deleteWorkout, updateWorkout, type WorkoutUpdate } from "@/db/workouts.repo"

const PatchSchema = z.object({
  minutes: z.number().positive().max(600).optional(),
  speedMph: z.number().positive().max(20).optional(),
  inclinePct: z.number().min(0).max(30).optional(),
  distanceMi: z.number().nonnegative().max(100).optional(),
  steps: z.number().int().nonnegative().max(1_000_000).optional(),
  calories: z.number().nonnegative().max(10_000).optional(),
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

  // If minutes changed, recompute start/end to keep the dedup window correct.
  if (d.minutes !== undefined) {
    const endAt = new Date()
    patch.endAt = endAt
    patch.startAt = new Date(endAt.getTime() - d.minutes * 60_000)
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
