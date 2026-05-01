CREATE TYPE "public"."quiz_language" AS ENUM('bg', 'en');--> statement-breakpoint
CREATE TYPE "public"."quiz_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."quiz_theme" AS ENUM('modern', 'vintage', 'neon');--> statement-breakpoint
CREATE TYPE "public"."round_type" AS ENUM('standard', 'mystery_artist', 'final');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('multiple_choice', 'open_text', 'audio', 'image_reveal', 'lyric_blank', 'decade');--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"logo_url" text,
	"contact_email" varchar(255),
	"contract_start" date,
	"contract_end" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"cover_image_url" text,
	"theme" "quiz_theme" DEFAULT 'modern' NOT NULL,
	"language" "quiz_language" DEFAULT 'bg' NOT NULL,
	"status" "quiz_status" DEFAULT 'draft' NOT NULL,
	"final_round_top_n" integer DEFAULT 0 NOT NULL,
	"sponsor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"order_index" integer NOT NULL,
	"round_type" "round_type" DEFAULT 'standard' NOT NULL,
	"intro_slide_text" text,
	"guest_video_url" text
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"question_type" "question_type" NOT NULL,
	"question_text" text NOT NULL,
	"media_url" text,
	"media_source" text,
	"media_attribution" text,
	"spotify_uri" text,
	"youtube_url" text,
	"options" jsonb,
	"correct_answer" jsonb NOT NULL,
	"acceptable_answers" jsonb,
	"time_limit_seconds" integer DEFAULT 20 NOT NULL,
	"points_base" integer DEFAULT 1 NOT NULL,
	"linked_story_id" uuid
);
--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quizzes_creator_idx" ON "quizzes" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "quizzes_status_idx" ON "quizzes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rounds_quiz_idx" ON "rounds" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "questions_round_idx" ON "questions" USING btree ("round_id");