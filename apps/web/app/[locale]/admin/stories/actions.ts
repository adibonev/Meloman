"use server";

import { eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { db } from "@meloman/db";
import { stories } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import {
  createStorySchema,
  updateStorySchema,
  estimateReadingMinutes,
  slugify,
} from "@/lib/schemas/story";

// Derive a unique slug from the provided one (or the title). Appends
// -2, -3… on collision so saving never fails on a duplicate slug.
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "story";
  let candidate = root;
  for (let i = 2; i < 50; i++) {
    const [clash] = await db
      .select({ id: stories.id })
      .from(stories)
      .where(eq(stories.slug, candidate))
      .limit(1);
    if (!clash) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role;
  if (role !== "admin" && role !== "super_admin") return null;
  return session.user;
}

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function decadeOf(year: number | undefined): number | null {
  return year ? Math.floor(year / 10) * 10 : null;
}

export async function createStoryAction(formData: FormData) {
  const user = await requireAdmin();
  if (!user) return { errorKey: "forbidden" as const };

  const yearRaw = formData.get("year");
  const raw = {
    slug: formData.get("slug"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") ?? "",
    body: formData.get("body"),
    coverImageUrl: formData.get("coverImageUrl") ?? "",
    heroImageUrl: formData.get("heroImageUrl") ?? "",
    artistName: formData.get("artistName") ?? "",
    year: yearRaw ? Number(yearRaw) : undefined,
    youtubeUrl: formData.get("youtubeUrl") ?? "",
    spotifyUri: formData.get("spotifyUri") ?? "",
    tags: parseTags(formData.get("tags")),
  };

  const parsed = createStorySchema.safeParse(raw);
  if (!parsed.success) return { errorKey: "invalid" as const };

  const slug = await uniqueSlug(parsed.data.slug || parsed.data.title);

  await db.insert(stories).values({
    authorId: user.id,
    slug,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle,
    body: parsed.data.body,
    coverImageUrl: parsed.data.coverImageUrl || null,
    heroImageUrl: parsed.data.heroImageUrl || null,
    artistName: parsed.data.artistName,
    year: parsed.data.year,
    decade: decadeOf(parsed.data.year),
    youtubeUrl: parsed.data.youtubeUrl || null,
    spotifyUri: parsed.data.spotifyUri,
    tags: parsed.data.tags ?? [],
    readingTimeMinutes: estimateReadingMinutes(parsed.data.body),
  });

  const locale = await getLocale();
  redirect({ href: "/admin/stories", locale });
}

export async function updateStoryAction(id: string, formData: FormData) {
  const user = await requireAdmin();
  if (!user) return { errorKey: "forbidden" as const };

  const yearRaw = formData.get("year");
  const raw = {
    title: formData.get("title"),
    subtitle: formData.get("subtitle") ?? "",
    body: formData.get("body"),
    coverImageUrl: formData.get("coverImageUrl") ?? "",
    heroImageUrl: formData.get("heroImageUrl") ?? "",
    artistName: formData.get("artistName") ?? "",
    year: yearRaw ? Number(yearRaw) : undefined,
    youtubeUrl: formData.get("youtubeUrl") ?? "",
    spotifyUri: formData.get("spotifyUri") ?? "",
    tags: parseTags(formData.get("tags")),
    published: formData.get("published") === "on",
  };

  const parsed = updateStorySchema.safeParse(raw);
  if (!parsed.success) return { errorKey: "invalid" as const };

  await db
    .update(stories)
    .set({
      title: parsed.data.title,
      subtitle: parsed.data.subtitle,
      body: parsed.data.body,
      coverImageUrl: parsed.data.coverImageUrl || null,
      heroImageUrl: parsed.data.heroImageUrl || null,
      artistName: parsed.data.artistName,
      year: parsed.data.year,
      decade: decadeOf(parsed.data.year),
      youtubeUrl: parsed.data.youtubeUrl || null,
      spotifyUri: parsed.data.spotifyUri,
      tags: parsed.data.tags ?? [],
      readingTimeMinutes: estimateReadingMinutes(parsed.data.body),
      publishedAt: parsed.data.published ? new Date() : null,
    })
    .where(eq(stories.id, id));

  revalidatePath("/admin/stories");
  const locale = await getLocale();
  redirect({ href: "/admin/stories", locale });
}
