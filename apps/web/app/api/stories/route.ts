import { NextResponse } from "next/server";
import { desc, isNotNull, sql } from "drizzle-orm";
import { db } from "@meloman/db";
import { stories } from "@meloman/db/schema";
import { apiError, requireAdmin } from "@/lib/api/guard";
import { getPageParams, pageMeta } from "@/lib/pagination";
import {
  createStorySchema,
  estimateReadingMinutes,
  slugify,
} from "@/lib/schemas/story";

/**
 * GET /api/stories — list published stories (public), paginated via
 *   `?page=&pageSize=` so a large table never ships in full.
 * POST /api/stories — create a story draft (admin).
 */
export async function GET(request: Request) {
  const params = getPageParams(new URL(request.url).searchParams);

  const [[{ total }], rows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(stories)
      .where(isNotNull(stories.publishedAt)),
    db
      .select({
        id: stories.id,
        slug: stories.slug,
        title: stories.title,
        subtitle: stories.subtitle,
        coverImageUrl: stories.coverImageUrl,
        artistName: stories.artistName,
        readingTimeMinutes: stories.readingTimeMinutes,
        publishedAt: stories.publishedAt,
      })
      .from(stories)
      .where(isNotNull(stories.publishedAt))
      .orderBy(desc(stories.publishedAt))
      .limit(params.limit)
      .offset(params.offset),
  ]);

  return NextResponse.json({
    stories: rows,
    ...pageMeta(params, Number(total)),
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalidJson", "Request body must be valid JSON.", 400);
  }

  const parsed = createStorySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "Story payload failed validation.", 422);
  }

  const [created] = await db
    .insert(stories)
    .values({
      authorId: guard.session.user.id,
      slug: parsed.data.slug ?? slugify(parsed.data.title),
      title: parsed.data.title,
      subtitle: parsed.data.subtitle,
      body: parsed.data.body,
      coverImageUrl: parsed.data.coverImageUrl || null,
      heroImageUrl: parsed.data.heroImageUrl || null,
      artistName: parsed.data.artistName,
      year: parsed.data.year,
      decade: parsed.data.year
        ? Math.floor(parsed.data.year / 10) * 10
        : null,
      youtubeUrl: parsed.data.youtubeUrl || null,
      spotifyUri: parsed.data.spotifyUri,
      tags: parsed.data.tags ?? [],
      readingTimeMinutes: estimateReadingMinutes(parsed.data.body),
    })
    .returning({ id: stories.id, slug: stories.slug });

  return NextResponse.json({ story: created }, { status: 201 });
}
