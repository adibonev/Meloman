import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// Editorial content (CLAUDE.md §6.4). `body` holds TipTap HTML output.
// `slug` is the public URL key. Stories are draft until `published_at` is
// set (nullable = draft).
export const stories = pgTable(
  "stories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    body: text("body").notNull(),
    coverImageUrl: text("cover_image_url"),
    heroImageUrl: text("hero_image_url"),
    artistName: varchar("artist_name", { length: 200 }),
    year: integer("year"),
    decade: integer("decade"),
    youtubeUrl: text("youtube_url"),
    spotifyUri: text("spotify_uri"),
    viewCount: integer("view_count").notNull().default(0),
    readingTimeMinutes: integer("reading_time_minutes").notNull().default(3),
    // Array of free-text tags (artists, genres, decades).
    tags: jsonb("tags"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("stories_slug_idx").on(table.slug),
    index("stories_artist_idx").on(table.artistName),
  ]
);

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
