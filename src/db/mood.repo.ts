import { eq } from "drizzle-orm"
import { db } from "./client"
import { dailyMood, type DailyMood, type NewDailyMood } from "./schema"

export async function getMood(date: string): Promise<DailyMood | null> {
  const [row] = await db
    .select()
    .from(dailyMood)
    .where(eq(dailyMood.date, date))
    .limit(1)
  return row ?? null
}

// Upsert by date so re-answering the same day overwrites that day's entry
// rather than creating a duplicate.
export async function upsertMood(input: NewDailyMood): Promise<DailyMood> {
  const [row] = await db
    .insert(dailyMood)
    .values(input)
    .onConflictDoUpdate({
      target: dailyMood.date,
      set: {
        score: input.score,
        comment: input.comment ?? null,
        updatedAt: new Date(),
      },
    })
    .returning()
  return row
}
