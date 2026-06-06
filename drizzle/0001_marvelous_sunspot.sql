CREATE TYPE "public"."workout_source" AS ENUM('treadmill', 'outdoor');--> statement-breakpoint
CREATE TABLE "daily_metric" (
	"date" date PRIMARY KEY NOT NULL,
	"steps" integer DEFAULT 0 NOT NULL,
	"distance_mi" numeric(6, 3) DEFAULT '0' NOT NULL,
	"active_calories" numeric(7, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"singleton" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"weight_lb" numeric(5, 2) DEFAULT '170' NOT NULL,
	"stride_in" numeric(4, 1) DEFAULT '28' NOT NULL,
	"daily_step_goal" integer DEFAULT 10000 NOT NULL,
	"weekly_miles_goal" numeric(5, 1) DEFAULT '20' NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"health_ingest_secret" text DEFAULT encode(gen_random_bytes(24), 'base64') NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workouts" ALTER COLUMN "speed_mph" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ALTER COLUMN "incline_pct" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "source" "workout_source" DEFAULT 'treadmill' NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "steps" integer;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "calories" numeric(7, 2);--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_external_id_unique" UNIQUE("external_id");