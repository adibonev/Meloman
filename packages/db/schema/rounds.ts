import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { quizzes } from "./quizzes";

export const roundTypeEnum = pgEnum("round_type", [
  "standard",
  "mystery_artist",
  "final",
]);

export const rounds = pgTable(
  "rounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    orderIndex: integer("order_index").notNull(),
    roundType: roundTypeEnum("round_type").notNull().default("standard"),
    introSlideText: text("intro_slide_text"),
    guestVideoUrl: text("guest_video_url"),
    // Top-N cutoff applied AFTER this round ends. Null = no cutoff (every
    // currently-active team continues). E.g. round 1 advancement_top_n=4
    // means after round 1 reveals, top 4 teams stay active, rest are
    // eliminated. The final round itself usually leaves this null because
    // there's no round after it to advance into.
    advancementTopN: integer("advancement_top_n"),
  },
  (table) => [index("rounds_quiz_idx").on(table.quizId)]
);

export type Round = typeof rounds.$inferSelect;
export type NewRound = typeof rounds.$inferInsert;
