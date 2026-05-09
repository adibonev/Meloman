import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { quizzes } from "./quizzes";
import { sponsors } from "./sponsors";

// Many-to-many sponsor assignment for quizzes. The legacy
// quizzes.sponsorId column remains for backwards compatibility, but new
// UI and presentation reads use this table so a quiz can show multiple
// venue/brand sponsors.
export const quizSponsors = pgTable(
  "quiz_sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    sponsorId: uuid("sponsor_id")
      .notNull()
      .references(() => sponsors.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("quiz_sponsors_quiz_idx").on(table.quizId),
    index("quiz_sponsors_sponsor_idx").on(table.sponsorId),
    uniqueIndex("quiz_sponsors_quiz_sponsor_unique").on(
      table.quizId,
      table.sponsorId
    ),
  ]
);

export type QuizSponsor = typeof quizSponsors.$inferSelect;
export type NewQuizSponsor = typeof quizSponsors.$inferInsert;
