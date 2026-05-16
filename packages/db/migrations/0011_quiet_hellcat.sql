CREATE TYPE "public"."badge_rarity" AS ENUM('common', 'rare', 'epic', 'legendary');--> statement-breakpoint
ALTER TABLE "badges" ADD COLUMN "category" varchar(40) DEFAULT 'special' NOT NULL;--> statement-breakpoint
ALTER TABLE "badges" ADD COLUMN "rarity" "badge_rarity" DEFAULT 'common' NOT NULL;--> statement-breakpoint
ALTER TABLE "badges" ADD COLUMN "emoji" varchar(16) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "badges" ADD COLUMN "xp_reward" integer DEFAULT 0 NOT NULL;