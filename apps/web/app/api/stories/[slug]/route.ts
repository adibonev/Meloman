import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@meloman/db";
import { stories } from "@meloman/db/schema";
import { apiError, requireAdmin } from "@/lib/api/guard";
import { updateStorySchema, estimateReadingMinutes } from "@/lib/schemas/story";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/stories/[slug] — story detail; increments view_count (public).
 * PATCH /api/stories/[slug] — update + toggle publish state (admin).
 */
export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;

  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.slug, slug))
    .limit(1);

  if (!story || !story.publishedAt) {
    return apiError("notFound", "Story not found.", 404);
  }

  // Fire-and-forget view bump; failure must not break the read.
  db.update(stories)
    .set({ viewCount: sql`${stories.viewCount} + 1` })
    .where(eq(stories.id, story.id))
    .catch((err) => console.error("view_count bump failed:", err));

  return NextResponse.json({ story });
}

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalidJson", "Request body must be valid JSON.", 400);
  }

  const parsed = updateStorySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "Story payload failed validation.", 422);
  }

  const [updated] = await db
    .update(stories)
    .set({
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
      publishedAt: parsed.data.published ? new Date() : null,
    })
    .where(eq(stories.slug, slug))
    .returning({ id: stories.id, slug: stories.slug });

  if (!updated) {
    return apiError("notFound", "Story not found.", 404);
  }

  return NextResponse.json({ story: updated });
}
