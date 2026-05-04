import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { teams } from "./teams";
import { users } from "./users";

// One row per (team, device) pair. The composite uniqueness on
// (team_id, device_fingerprint) is the anti-cheat backbone — same phone
// cannot join two teams in the same session (CLAUDE.md §4.9).
//
// `userId` is nullable: anonymous players may not have a user row yet, in
// which case `anonymousName` carries the display name. Once a player signs
// in mid-game, we promote the row by setting `userId`.
export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    anonymousName: varchar("anonymous_name", { length: 80 }),
    deviceFingerprint: varchar("device_fingerprint", { length: 128 }).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("team_members_team_idx").on(table.teamId),
    uniqueIndex("team_members_team_device_unique").on(
      table.teamId,
      table.deviceFingerprint
    ),
  ]
);

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
