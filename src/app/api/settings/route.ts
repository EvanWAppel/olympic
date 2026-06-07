import { NextResponse } from "next/server"
import { z } from "zod"
import { getSettings, updateSettings } from "@/db/settings.repo"

const PatchSchema = z.object({
  weightLb: z.number().positive().max(1000).optional(),
  strideIn: z.number().positive().max(100).optional(),
  dailyStepGoal: z.number().int().positive().max(1_000_000).optional(),
  weeklyMilesGoal: z.number().positive().max(1000).optional(),
  timezone: z.string().min(1).max(100).optional(),
})

export async function GET() {
  const row = await getSettings()
  return NextResponse.json(row)
}

export async function PATCH(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const data = parsed.data
  const row = await updateSettings({
    ...(data.weightLb !== undefined && { weightLb: data.weightLb.toString() }),
    ...(data.strideIn !== undefined && { strideIn: data.strideIn.toString() }),
    ...(data.dailyStepGoal !== undefined && { dailyStepGoal: data.dailyStepGoal }),
    ...(data.weeklyMilesGoal !== undefined && {
      weeklyMilesGoal: data.weeklyMilesGoal.toString(),
    }),
    ...(data.timezone !== undefined && { timezone: data.timezone }),
  })
  return NextResponse.json(row)
}
