import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const badgeRarityEnum = pgEnum("badge_rarity", [
  "common",
  "rare",
  "epic",
  "legendary",
]);

// Badge catalog (CLAUDE.md §6.5). The catalog of record is
// packages/db/seed-badges.ts; this table stores it. `criteria` describes
// the auto-detection rule (e.g. { type: "streak", days: 7 }); `rarity`
// drives the UI color, `xpReward` feeds the XP system (CLAUDE.md §3.2).
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  criteria: jsonb("criteria"),
  category: varchar("category", { length: 40 }).notNull().default("special"),
  rarity: badgeRarityEnum("rarity").notNull().default("common"),
  emoji: varchar("emoji", { length: 16 }).notNull().default(""),
  xpReward: integer("xp_reward").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Earned badges. Composite PK (user_id, badge_id) — a badge is earned once.
export const userBadges = pgTable(
  "user_badges",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    context: jsonb("context"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.badgeId] })]
);

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
