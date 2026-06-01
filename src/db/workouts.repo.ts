import { desc } from "drizzle-orm"
import { db } from "./client"
import { workouts, type NewWorkout, type Workout } from "./schema"

export async function createWorkout(input: NewWorkout): Promise<Workout> {
  const [row] = await db.insert(workouts).values(input).returning()
  return row
}

export async function listWorkouts(): Promise<Workout[]> {
  return db.select().from(workouts).orderBy(desc(workouts.startAt))
}
