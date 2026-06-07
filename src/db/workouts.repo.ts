import { desc, eq } from "drizzle-orm"
import { db } from "./client"
import { workouts, type NewWorkout, type Workout } from "./schema"

export async function createWorkout(input: NewWorkout): Promise<Workout> {
  const [row] = await db.insert(workouts).values(input).returning()
  return row
}

export async function listWorkouts(): Promise<Workout[]> {
  return db.select().from(workouts).orderBy(desc(workouts.startAt))
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const [row] = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1)
  return row ?? null
}

export type WorkoutUpdate = Partial<
  Omit<Workout, "id" | "createdAt" | "updatedAt" | "source" | "externalId">
>

export async function updateWorkout(
  id: string,
  patch: WorkoutUpdate,
): Promise<Workout | null> {
  const [row] = await db
    .update(workouts)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(workouts.id, id))
    .returning()
  return row ?? null
}

export async function deleteWorkout(id: string): Promise<boolean> {
  const result = await db
    .delete(workouts)
    .where(eq(workouts.id, id))
    .returning({ id: workouts.id })
  return result.length > 0
}
