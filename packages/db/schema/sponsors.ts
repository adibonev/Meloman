import { date, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  // External logo URL (admin pastes a public image link).
  logoUrl: text("logo_url"),
  // Cloudflare R2 object key for an uploaded logo. Mutually exclusive
  // with logoUrl in the admin form; the renderer prefers this when set
  // because it generates a fresh signed URL on each render (5-min
  // expiry) so the image can't be hot-linked.
  logoR2Key: text("logo_r2_key"),
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
