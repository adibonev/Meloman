import {
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { questions } from "./questions";
import { stories } from "./stories";

// Daily engagement content (CLAUDE.md §6.4). One row per calendar date.
// `payload` is structured per content_type:
//   song_of_day:    { title, artist, albumCoverUrl, story, audioR2Key?,
//                      youtubeUrl?, spotifyUri?, trivia: {...} }
//   mystery_artist: { name, blurredImageUrl, hints: [string], story,
//                      acceptableAnswers: [string] }
export const dailyContentTypeEnum = pgEnum("daily_content_type", [
  "song_of_day",
  "mystery_artist",
]);

export const dailyContent = pgTable(
  "daily_content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentDate: date("content_date").notNull().unique(),
    contentType: dailyContentTypeEnum("content_type").notNull(),
    payload: jsonb("payload").notNull(),
    linkedQuestionId: uuid("linked_question_id").references(
      () => questions.id,
      { onDelete: "set null" }
    ),
    linkedStoryId: uuid("linked_story_id").references(() => stories.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("daily_content_date_idx").on(table.contentDate)]
);

export type DailyContent = typeof dailyContent.$inferSelect;
export type NewDailyContent = typeof dailyContent.$inferInsert;
