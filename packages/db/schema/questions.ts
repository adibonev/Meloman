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
    spotifyUri: text("spotify_uri"),
    youtubeUrl: text("youtube_url"),
    options: jsonb("options"),
    correctAnswer: jsonb("correct_answer").notNull(),
    acceptableAnswers: jsonb("acceptable_answers"),
    timeLimitSeconds: integer("time_limit_seconds").notNull().default(20),
    pointsBase: integer("points_base").notNull().default(1),
    // FK to stories.id will be added in Sprint 5 once the stories table exists.
    linkedStoryId: uuid("linked_story_id"),
  },
  (table) => [index("questions_round_idx").on(table.roundId)]
);

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
