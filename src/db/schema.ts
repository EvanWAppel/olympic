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
  bigint,
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

// --- v2: single-user passkey auth (PRD §7) ---

// One human (me), but multiple registered devices allowed (iPhone + laptop).
export const webauthnCredential = pgTable("webauthn_credential", {
  // Credential ID, base64url-encoded (as returned by the authenticator).
  id: text("id").primaryKey(),
  // COSE public key, base64url-encoded.
  publicKey: text("public_key").notNull(),
  // Signature counter; a regression signals a cloned authenticator.
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  transports: text("transports").array(),
  deviceLabel: text("device_label"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
})

export const webauthnChallengeType = pgEnum("webauthn_challenge_type", [
  "registration",
  "authentication",
])

// Short-lived, single-use ceremony challenges (consumed on read, ≤5 min TTL).
export const webauthnChallenge = pgTable("webauthn_challenge", {
  challenge: text("challenge").primaryKey(),
  type: webauthnChallengeType("type").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
})

export type Workout = typeof workouts.$inferSelect
export type NewWorkout = typeof workouts.$inferInsert
export type Settings = typeof settings.$inferSelect
export type NewSettings = typeof settings.$inferInsert
export type DailyMetric = typeof dailyMetric.$inferSelect
export type NewDailyMetric = typeof dailyMetric.$inferInsert
export type WebauthnCredential = typeof webauthnCredential.$inferSelect
export type NewWebauthnCredential = typeof webauthnCredential.$inferInsert
export type WebauthnChallenge = typeof webauthnChallenge.$inferSelect
export type NewWebauthnChallenge = typeof webauthnChallenge.$inferInsert
