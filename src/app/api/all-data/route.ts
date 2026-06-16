import { NextResponse } from "next/server"
import { db } from "@/db/client"
import { dailyMetric, workouts } from "@/db/schema"

export const runtime = "nodejs"

export const CONFIRM_PHRASE = "DELETE ALL DATA"

/**
 * Wipes all logged data — workouts and daily metrics. Settings (goals,
 * timezone, ingest secret) are configuration and are intentionally preserved.
 * Requires `x-confirm-delete: DELETE ALL DATA` to guard against accidental calls.
 */
export async function DELETE(req: Request) {
  if (req.headers.get("x-confirm-delete") !== CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        error: "confirmation_required",
        message: `set header 'x-confirm-delete: ${CONFIRM_PHRASE}' to confirm`,
      },
      { status: 400 },
    )
  }

  const deletedWorkouts = await db
    .delete(workouts)
    .returning({ id: workouts.id })
  const deletedMetrics = await db
    .delete(dailyMetric)
    .returning({ date: dailyMetric.date })

  return NextResponse.json({
    workoutsDeleted: deletedWorkouts.length,
    dailyMetricsDeleted: deletedMetrics.length,
  })
}
