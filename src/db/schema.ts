import {
  pgTable,
  pgEnum,
  uuid,
  timestamp,
  numeric,
  text,
  integer,
  date,
  boolean,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const workoutSource = pgEnum("workout_source", ["treadmill", "outdoor"])

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: workoutSource("source").notNull().default("treadmill"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  minutes: numeric("minutes", { precision: 6, scale: 2 }).notNull(),
  speedMph: numeric("speed_mph", { precision: 4, scale: 2 }),
  inclinePct: numeric("incline_pct", { precision: 4, scale: 2 }),
  distanceMi: numeric("distance_mi", { precision: 6, scale: 3 }).notNull(),
  steps: integer("steps"),
  calories: numeric("calories", { precision: 7, scale: 2 }),
  notes: text("notes"),
  externalId: text("external_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Singleton row enforced by check constraint on `singleton = true`.
export const settings = pgTable("settings", {
  singleton: boolean("singleton").primaryKey().default(true),
  weightLb: numeric("weight_lb", { precision: 5, scale: 2 }).notNull().default("170"),
  strideIn: numeric("stride_in", { precision: 4, scale: 1 }).notNull().default("28"),
  dailyStepGoal: integer("daily_step_goal").notNull().default(10_000),
  weeklyMilesGoal: numeric("weekly_miles_goal", { precision: 5, scale: 1 })
    .notNull()
    .default("20"),
  timezone: text("timezone").notNull().default("America/New_York"),
  healthIngestSecret: text("health_ingest_secret")
    .notNull()
    .default(sql`encode(gen_random_bytes(24), 'base64')`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Daily "how are you feeling?" check-in: a 1-10 score with an optional comment.
export const moodCheckins = pgTable("mood_checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  score: integer("score").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const dailyMetric = pgTable("daily_metric", {
  date: date("date").primaryKey(),
  steps: integer("steps").notNull().default(0),
  distanceMi: numeric("distance_mi", { precision: 6, scale: 3 }).notNull().default("0"),
  activeCalories: numeric("active_calories", { precision: 7, scale: 2 })
    .notNull()
    .default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Workout = typeof workouts.$inferSelect
export type NewWorkout = typeof workouts.$inferInsert
export type Settings = typeof settings.$inferSelect
export type NewSettings = typeof settings.$inferInsert
export type DailyMetric = typeof dailyMetric.$inferSelect
export type NewDailyMetric = typeof dailyMetric.$inferInsert
export type MoodCheckin = typeof moodCheckins.$inferSelect
export type NewMoodCheckin = typeof moodCheckins.$inferInsert
