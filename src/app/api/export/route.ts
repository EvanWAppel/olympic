import AdmZip from "adm-zip"
import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { dailyMetric, workouts } from "@/db/schema"
import { toCsv } from "@/lib/csv"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WORKOUT_COLUMNS = [
  "id",
  "source",
  "startAt",
  "endAt",
  "minutes",
  "speedMph",
  "inclinePct",
  "distanceMi",
  "steps",
  "calories",
  "notes",
  "externalId",
  "createdAt",
  "updatedAt",
] as const

const METRIC_COLUMNS = [
  "date",
  "steps",
  "distanceMi",
  "activeCalories",
  "updatedAt",
] as const

export async function GET() {
  const [workoutRows, metricRows] = await Promise.all([
    db.select().from(workouts).orderBy(asc(workouts.startAt)),
    db.select().from(dailyMetric).orderBy(asc(dailyMetric.date)),
  ])

  const zip = new AdmZip()
  zip.addFile(
    "workouts.csv",
    Buffer.from(toCsv(workoutRows, [...WORKOUT_COLUMNS]), "utf-8"),
  )
  zip.addFile(
    "daily_metrics.csv",
    Buffer.from(toCsv(metricRows, [...METRIC_COLUMNS]), "utf-8"),
  )

  const body = zip.toBuffer()
  const filename = `olympic-export-${new Date().toISOString().slice(0, 10)}.zip`

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  })
}
