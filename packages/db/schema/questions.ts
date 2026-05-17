import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { rounds } from "./rounds";

export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "open_text",
  "audio",
  "image_reveal",
  "lyric_blank",
  "decade",
]);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    questionType: questionTypeEnum("question_type").notNull(),
    questionText: text("question_text").notNull(),
    mediaUrl: text("media_url"),
    mediaSource: text("media_source"),
    mediaAttribution: text("media_attribution"),
    // Image-reveal questions only. Pixels of CSS blur applied during the
    // active window. Admin picks per question because every photo has a
    // different "guessability" — a tight portrait needs less blur than a
    // wide concert shot. Nullable so existing rows pre-migration keep
    // working with a sensible default.
    mediaBlurPx: integer("media_blur_px"),
    spotifyUri: text("spotify_uri"),
    youtubeUrl: text("youtube_url"),
    options: jsonb("options"),
    correctAnswer: jsonb("correct_answer").notNull(),
    acceptableAnswers: jsonb("acceptable_answers"),
    // Optional per-question localisation overlay. Base columns above
    // stay canonical (authored in the quiz's primary language); this
    // holds the *other* locale's text only. Shape:
    //   { en?: { questionText?, options?: string[], acceptableAnswers?: string[] } }
    // Nullable so every existing row keeps working untouched.
    translations: jsonb("translations"),
    timeLimitSeconds: integer("time_limit_seconds").notNull().default(20),
    pointsBase: integer("points_base").notNull().default(1),
    // FK to stories.id will be added in Sprint 5 once the stories table exists.
    linkedStoryId: uuid("linked_story_id"),
  },
  (table) => [index("questions_round_idx").on(table.roundId)]
);

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
