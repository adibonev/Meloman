ALTER TABLE "game_sessions" ADD COLUMN "scheduled_start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "scheduled_end_at" timestamp with time zone;