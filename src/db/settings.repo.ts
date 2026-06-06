import { eq } from "drizzle-orm"
import { db } from "./client"
import { settings, type Settings } from "./schema"

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(settings).limit(1)
  if (rows.length > 0) return rows[0]

  const [inserted] = await db
    .insert(settings)
    .values({ singleton: true })
    .onConflictDoNothing()
    .returning()
  if (inserted) return inserted

  // Race: another caller inserted concurrently.
  const refetch = await db.select().from(settings).limit(1)
  return refetch[0]
}

export type SettingsUpdate = Partial<
  Pick<
    Settings,
    | "weightLb"
    | "strideIn"
    | "dailyStepGoal"
    | "weeklyMilesGoal"
    | "timezone"
    | "healthIngestSecret"
  >
>

export async function updateSettings(input: SettingsUpdate): Promise<Settings> {
  // Ensure the singleton row exists before updating.
  await getSettings()
  const [row] = await db
    .update(settings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(settings.singleton, true))
    .returning()
  return row
}
