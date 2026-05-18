ALTER TABLE "game_sessions" ADD COLUMN "public_event" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "venue" varchar(160);