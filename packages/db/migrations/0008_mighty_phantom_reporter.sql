CREATE TABLE "quiz_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_sponsors" ADD CONSTRAINT "quiz_sponsors_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sponsors" ADD CONSTRAINT "quiz_sponsors_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_sponsors_quiz_idx" ON "quiz_sponsors" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_sponsors_sponsor_idx" ON "quiz_sponsors" USING btree ("sponsor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_sponsors_quiz_sponsor_unique" ON "quiz_sponsors" USING btree ("quiz_id","sponsor_id");--> statement-breakpoint
INSERT INTO "quiz_sponsors" ("quiz_id", "sponsor_id")
SELECT "id", "sponsor_id"
FROM "quizzes"
WHERE "sponsor_id" IS NOT NULL
ON CONFLICT DO NOTHING;
