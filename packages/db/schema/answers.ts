import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { questions } from "./questions";
import { teams } from "./teams";

// One row per (team, question). The unique index is the source of truth for
// the captain-only / one-submission-per-team rule — even if two captains
// race a click somehow, Postgres rejects the duplicate.
//
// `submittedAnswer` is jsonb to fit all 6 question types: int (multiple
// choice index), string (open text / audio), string[] (lyric blank), or
// { decade, year } (decade/year). Type-checked at action layer, not DB.
export const answers = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    submittedAnswer: jsonb("submitted_answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    // True when the host accepted a fuzzy/edge answer the auto-grader had
    // rejected (open text, lyric blank). Tracked for audit.
    hostOverride: boolean("host_override").notNull().default(false),
    timeToAnswerMs: integer("time_to_answer_ms").notNull(),
    pointsAwarded: integer("points_awarded").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("answers_team_idx").on(table.teamId),
    index("answers_question_idx").on(table.questionId),
    uniqueIndex("answers_team_question_unique").on(
      table.teamId,
      table.questionId
    ),
  ]
);

export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
