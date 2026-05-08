import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { gameSessions } from "./game-sessions";
import { users } from "./users";

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    // Captain is the only team member allowed to submit answers. May be null
    // for fully-anonymous teams (anonymous users still get a users row but
    // we keep the FK nullable in case a session resumes with deleted users).
    captainUserId: uuid("captain_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    color: varchar("color", { length: 16 }).notNull(),
    avatarEmoji: varchar("avatar_emoji", { length: 8 }).notNull(),
    // Denormalized: maintained by the answer-submission flow so the
    // leaderboard query is a single SELECT instead of a sum-and-join. The
    // host-side reveal action recomputes from `answers` if the totals
    // ever drift out of sync.
    totalScore: integer("total_score").notNull().default(0),
    // Legacy: was true only for teams that made the quiz-level final
    // cutoff (`quizzes.final_round_top_n`). Superseded by `isActive`,
    // which generalises the concept to per-round cutoffs. Kept on the
    // table to avoid a destructive migration; will be dropped once we
    // confirm no production data depends on it.
    isFinalist: boolean("is_finalist").notNull().default(false),
    // "Still in the game" flag. Defaults to true; flips to false when a
    // per-round cutoff eliminates the team. Eliminated teams keep their
    // score visible but cannot submit on subsequent questions.
    isActive: boolean("is_active").notNull().default(true),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("teams_session_idx").on(table.sessionId)]
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
