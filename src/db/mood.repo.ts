import { desc } from "drizzle-orm"
import { db } from "./client"
import { moodCheckins, type MoodCheckin, type NewMoodCheckin } from "./schema"

export async function createMoodCheckin(
  input: NewMoodCheckin,
): Promise<MoodCheckin> {
  const [row] = await db.insert(moodCheckins).values(input).returning()
  return row
}

export async function listMoodCheckins(): Promise<MoodCheckin[]> {
  return db.select().from(moodCheckins).orderBy(desc(moodCheckins.createdAt))
}
