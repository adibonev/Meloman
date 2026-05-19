import type { Metadata } from "next";
import { and, desc, isNotNull, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { stories } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { PaginationNav } from "@/components/pagination-nav";
import { getPageParams, pageMeta } from "@/lib/pagination";
import { RegisterCta } from "@/components/register-cta";

// Category tabs filter by the story `tags` jsonb array. The values are
// content tags (Bulgarian, locale-independent) — a story shows under a
// tab when its tags contain the exact string. Empty tab = data not yet
// tagged, not a bug.
const CATEGORIES = [
  "Българска музика",
  "Рок",
  "Поп",
  "Истории от куиза",
  "Песен на деня",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("storiesTitle"),
    description: t("storiesDescription"),
  };
}

export default async function StoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Stories");

  // Paginated server-side — the public catalogue can grow unbounded.
  const sp = await searchParams;
  const pageParams = getPageParams(sp);
  const rawCat = typeof sp.cat === "string" ? sp.cat : undefined;
  const activeCat = CATEGORIES.find((c) => c === rawCat);
  const whereClause = and(
    isNotNull(stories.publishedAt),
    activeCat ? sql`${stories.tags} ? ${activeCat}` : undefined
  );
  const [[{ total }], rows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(stories)
      .where(whereClause),
    db
      .select({
        slug: stories.slug,
        title: stories.title,
        subtitle: stories.subtitle,
        coverImageUrl: stories.coverImageUrl,
        artistName: stories.artistName,
        readingTimeMinutes: stories.readingTimeMinutes,
      })
      .from(stories)
      .where(whereClause)
      .orderBy(desc(stories.publishedAt))
      .limit(pageParams.limit)
      .offset(pageParams.offset),
  ]);
  const meta = pageMeta(pageParams, Number(total));

  // First card of the current page reads as the "featured" block; it
  // stays a valid layout on any page.
  const [featured, ...rest] = rows;

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-heading text-5xl font-black tracking-wider uppercase sm:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
      </header>

      <nav className="mb-10 flex flex-wrap gap-2" aria-label={t("filterLabel")}>
        <Link
          href="/stories"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            activeCat
              ? "border-border text-muted-foreground hover:bg-secondary"
              : "border-l-primary border-primary bg-card font-semibold text-foreground"
          }`}
        >
          {t("allCategory")}
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={{ pathname: "/stories", query: { cat } }}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              activeCat === cat
                ? "border-primary bg-card font-semibold text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {cat}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-12">
          <Link
            href={`/stories/${featured.slug}`}
            className="group block overflow-hidden rounded-lg border border-border border-l-2 border-l-primary bg-card transition-all hover:border-l-4 hover:bg-secondary"
          >
            {featured.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.coverImageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[21/9] w-full object-cover"
              />
            )}
            <div className="p-6 sm:p-8">
              <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-primary">
                {t("featured")}
              </p>
              <h2 className="font-heading text-4xl font-black uppercase group-hover:underline sm:text-6xl">
                {featured.title}
              </h2>
              {featured.subtitle && (
                <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                  {featured.subtitle}
                </p>
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                {featured.artistName ? `${featured.artistName} · ` : ""}
                {t("readTime", { minutes: featured.readingTimeMinutes })}
              </p>
            </div>
          </Link>

          {rest.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((story) => (
                <Link
                  key={story.slug}
                  href={`/stories/${story.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border border-l-2 border-l-primary bg-card transition-all hover:-translate-y-0.5 hover:border-l-4 hover:bg-secondary"
                >
                  {story.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.coverImageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-heading text-2xl font-black uppercase group-hover:underline">
                      {story.title}
                    </h3>
                    {story.subtitle && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {story.subtitle}
                      </p>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                      {story.artistName ? `${story.artistName} · ` : ""}
                      {t("readTime", { minutes: story.readingTimeMinutes })}
                    </p>
                    <span className="mt-4 text-xs font-semibold tracking-[0.2em] uppercase text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <PaginationNav
        basePath="/stories"
        page={meta.page}
        totalPages={meta.totalPages}
        extraQuery={activeCat ? { cat: activeCat } : undefined}
      />
      <RegisterCta />
    </main>
  );
}
