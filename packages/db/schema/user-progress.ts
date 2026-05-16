import {
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// Streak + XP backbone (CLAUDE.md §6.1). One row per user per day.
// Composite PK (user_id, date) keeps the daily-fetch read fast and makes
// "upsert today's XP" a single ON CONFLICT.
//   - daily_xp: XP accumulated that day (>= 10 keeps the streak alive)
//   - streak_count_at_day: denormalized streak length on that date
//   - activities: array of activity types completed that day
export const userProgress = pgTable(
  "user_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    dailyXp: integer("daily_xp").notNull().default(0),
    streakCountAtDay: integer("streak_count_at_day").notNull().default(0),
    activities: jsonb("activities"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.date] })]
);

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
