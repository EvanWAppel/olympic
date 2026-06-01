CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"minutes" numeric(6, 2) NOT NULL,
	"speed_mph" numeric(4, 2) NOT NULL,
	"incline_pct" numeric(4, 2) NOT NULL,
	"distance_mi" numeric(6, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
