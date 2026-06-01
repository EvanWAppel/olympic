import {
  pgTable,
  uuid,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core"

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  minutes: numeric("minutes", { precision: 6, scale: 2 }).notNull(),
  speedMph: numeric("speed_mph", { precision: 4, scale: 2 }).notNull(),
  inclinePct: numeric("incline_pct", { precision: 4, scale: 2 }).notNull(),
  distanceMi: numeric("distance_mi", { precision: 6, scale: 3 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Workout = typeof workouts.$inferSelect
export type NewWorkout = typeof workouts.$inferInsert
