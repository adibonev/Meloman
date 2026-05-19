import {
  boolean,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { quizzes } from "./quizzes";
import { questions } from "./questions";
import { users } from "./users";

// Live-quiz state machine. Strict transitions are enforced in the Server
// Actions that drive the host: lobby → active → reveal → active/finished,
// with paused as a sidecar from active or reveal. Every API endpoint that
// mutates session state MUST validate the current status (see CLAUDE.md §4.2).
export const gameSessionStatusEnum = pgEnum("game_session_status", [
  "lobby",
  "active",
  "reveal",
  "between_rounds",
  "paused",
  "finished",
]);

export const gameSessions = pgTable(
  "game_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "restrict" }),
    hostId: uuid("host_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // 6-character human-friendly join code (e.g. "MELO42"). Players type or
    // scan this. Generation logic enforces uniqueness in the Server Action.
    joinCode: varchar("join_code", { length: 6 }).notNull().unique(),
    status: gameSessionStatusEnum("status").notNull().default("lobby"),
    currentQuestionId: uuid("current_question_id").references(
      () => questions.id,
      { onDelete: "set null" }
    ),
    // Server-authoritative timing. Clients compute `remainingMs = endsAt -
    // (Date.now() + offset)` using the offset they derive from the most
    // recent server-pushed `serverNow`.
    questionStartedAt: timestamp("question_started_at", { withTimezone: true }),
    questionEndsAt: timestamp("question_ends_at", { withTimezone: true }),
    // When the host pauses the session. On resume we shift questionStartedAt
    // and questionEndsAt forward by (now - pausedAt) so the player gets the
    // same remaining time they had at the moment the host clicked pause.
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    // Status to return to on resume. We can only pause from `active` or
    // `reveal`, and we need to remember which one so resume puts us back
    // there cleanly. Nullable: only set while status === 'paused'.
    pausedFromStatus: gameSessionStatusEnum("paused_from_status"),
    // Surfaced on the public /events page when the host opts in. Venue
    // is free text (e.g. "Бар Х, Видин").
    publicEvent: boolean("public_event").notNull().default(false),
    venue: varchar("venue", { length: 160 }),
    // Host-declared schedule for the public event. This is the planned
    // start (and optional end) shown on /events — distinct from
    // `startedAt`, which is only set when the host actually clicks
    // Start. Classification (upcoming/live/past) is time-based off
    // these; if `scheduledEndAt` is null we assume a 3-hour duration.
    scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }),
    scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("game_sessions_quiz_idx").on(table.quizId),
    index("game_sessions_status_idx").on(table.status),
  ]
);

export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
