ALTER TYPE "public"."game_session_status" ADD VALUE 'between_rounds' BEFORE 'paused';--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "advancement_top_n" integer;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;