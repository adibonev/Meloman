import type { Metadata } from "next";
import { and, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { stories } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { RegisterCta } from "@/components/register-cta";
import { JsonLd } from "@/components/json-ld";
import { ShareButtons } from "@/components/share-buttons";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const [story] = await db
    .select({
      title: stories.title,
      subtitle: stories.subtitle,
      body: stories.body,
    })
    .from(stories)
    .where(eq(stories.slug, slug))
    .limit(1);
  if (!story) {
    return {
      title: t("storiesTitle"),
      description: t("storiesDescription"),
    };
  }
  const plain = (story.subtitle || story.body || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    title: `${story.title}${t("storySuffix")}`,
    description: plain.slice(0, 150),
  };
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("StoryDetail");

  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.slug, slug))
    .limit(1);

  if (!story || !story.publishedAt) {
    notFound();
  }

  // Fire-and-forget view bump; a failed counter must not break the page.
  db.update(stories)
    .set({ viewCount: sql`${stories.viewCount} + 1` })
    .where(eq(stories.id, story.id))
    .catch((err) => console.error("view_count bump failed:", err));

  const related = await db
    .select({
      slug: stories.slug,
      title: stories.title,
      readingTimeMinutes: stories.readingTimeMinutes,
    })
    .from(stories)
    .where(and(isNotNull(stories.publishedAt), ne(stories.id, story.id)))
    .orderBy(desc(stories.publishedAt))
    .limit(3);

  const articleUrl = `${SITE_URL}${
    locale === "en" ? "/en" : ""
  }/stories/${slug}`;
  const articleDesc = (story.subtitle || story.body || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: story.title,
          description: articleDesc,
          datePublished: story.publishedAt?.toISOString(),
          image: story.heroImageUrl || story.coverImageUrl || undefined,
          author: { "@type": "Organization", name: "Meloman" },
          publisher: { "@type": "Organization", name: "Meloman" },
          mainEntityOfPage: articleUrl,
        }}
      />
      <Link
        href="/stories"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← {t("backToStories")}
      </Link>

      <header className="mt-8">
        <h1 className="font-heading text-4xl font-black tracking-wide uppercase sm:text-6xl">
          {story.title}
        </h1>
        {story.subtitle && (
          <p className="mt-4 text-xl text-muted-foreground">
            {story.subtitle}
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          {story.artistName ? `${story.artistName} · ` : ""}
          {t("readTime", { minutes: story.readingTimeMinutes })}
        </p>
      </header>

      {story.heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.heroImageUrl}
          alt=""
          className="my-10 aspect-video w-full rounded-lg object-cover"
        />
      )}

      {/* Body is admin-authored TipTap HTML. */}
      <article
        className="prose prose-invert mt-10 mx-auto max-w-[68ch] leading-relaxed [&_p]:mb-5 [&_p]:text-lg"
        dangerouslySetInnerHTML={{ __html: story.body }}
      />

      {(story.youtubeUrl || story.spotifyUri) && (
        <div className="mt-12 flex flex-wrap gap-3">
          {story.youtubeUrl && (
            <a
              href={story.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary" })}
            >
              {t("listenOnYoutube")}
            </a>
          )}
          {story.spotifyUri && (
            <a
              href={story.spotifyUri}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary" })}
            >
              {t("openInSpotify")}
            </a>
          )}
        </div>
      )}

      {related.length > 0 && (
        <footer className="mt-16 border-t border-border pt-10">
          <h2 className="font-heading text-2xl font-black uppercase">
            {t("related")}
          </h2>
          <ul className="mt-6 space-y-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/stories/${r.slug}`}
                  className="text-lg hover:underline"
                >
                  {r.title}
                </Link>
                <span className="ml-2 text-sm text-muted-foreground">
                  {t("readTime", { minutes: r.readingTimeMinutes })}
                </span>
              </li>
            ))}
          </ul>
        </footer>
      )}
      <ShareButtons url={articleUrl} />
      <RegisterCta variant="stories" />
    </main>
  );
}
