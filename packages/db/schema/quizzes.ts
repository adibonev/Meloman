import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sponsors } from "./sponsors";

export const quizThemeEnum = pgEnum("quiz_theme", ["modern", "vintage", "neon"]);
export const quizLanguageEnum = pgEnum("quiz_language", ["bg", "en"]);
export const quizStatusEnum = pgEnum("quiz_status", [
  "draft",
  "published",
  "archived",
]);

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    theme: quizThemeEnum("theme").notNull().default("modern"),
    language: quizLanguageEnum("language").notNull().default("bg"),
    status: quizStatusEnum("status").notNull().default("draft"),
    finalRoundTopN: integer("final_round_top_n").notNull().default(0),
    sponsorId: uuid("sponsor_id").references(() => sponsors.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    // Soft delete: rows with deleted_at set are hidden from default queries
    // and can be restored from the Trash UI. Permanent delete cascades to
    // rounds and questions.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("quizzes_creator_idx").on(table.creatorId),
    index("quizzes_status_idx").on(table.status),
  ]
);

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
