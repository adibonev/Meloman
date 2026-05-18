import type { MetadataRoute } from "next";
import { desc, isNotNull } from "drizzle-orm";
import { db } from "@meloman/db";
import { dailyContent, stories } from "@meloman/db/schema";
import { SITE_URL } from "@/lib/site";

// Public routes for both locales (BG has no prefix, EN under /en —
// localePrefix "as-needed"). Story + artist pages come from published
// stories so every article is a discoverable, indexable URL.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const published = await db
    .select({
      slug: stories.slug,
      artistName: stories.artistName,
      updatedAt: stories.publishedAt,
    })
    .from(stories)
    .where(isNotNull(stories.publishedAt))
    .orderBy(desc(stories.publishedAt));

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  function add(path: string, lastModified: Date) {
    entries.push({ url: `${SITE_URL}${path}`, lastModified });
    entries.push({ url: `${SITE_URL}/en${path}`, lastModified });
  }

  for (const p of ["", "/stories", "/daily", "/daily/archive"]) {
    add(p, now);
  }

  const days = await db
    .select({ contentDate: dailyContent.contentDate })
    .from(dailyContent)
    .orderBy(desc(dailyContent.contentDate));
  for (const d of days) add(`/daily/${d.contentDate}`, now);

  for (const s of published) {
    add(`/stories/${s.slug}`, s.updatedAt ?? now);
  }

  const artistSlugs = new Set(
    published
      .map((s) => s.artistName)
      .filter((n): n is string => !!n)
      .map((n) => n.toLowerCase().replace(/\s+/g, "-"))
  );
  for (const slug of artistSlugs) add(`/artists/${slug}`, now);

  return entries;
}
