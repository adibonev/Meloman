import { date, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  logoUrl: text("logo_url"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contractStart: date("contract_start"),
  contractEnd: date("contract_end"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
