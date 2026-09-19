CREATE TYPE "public"."webauthn_challenge_type" AS ENUM('registration', 'authentication');--> statement-breakpoint
CREATE TABLE "webauthn_challenge" (
	"challenge" text PRIMARY KEY NOT NULL,
	"type" "webauthn_challenge_type" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webauthn_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"counter" bigint DEFAULT 0 NOT NULL,
	"transports" text[],
	"device_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
