import { desc, isNotNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { stories } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Stories");

  const rows = await db
    .select({
      slug: stories.slug,
      title: stories.title,
      subtitle: stories.subtitle,
      coverImageUrl: stories.coverImageUrl,
      artistName: stories.artistName,
      readingTimeMinutes: stories.readingTimeMinutes,
    })
    .from(stories)
    .where(isNotNull(stories.publishedAt))
    .orderBy(desc(stories.publishedAt));

  const [featured, ...rest] = rows;

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-heading text-5xl font-black tracking-wider uppercase sm:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-16">
          <Link
            href={`/stories/${featured.slug}`}
            className="group block border-b border-border pb-12"
          >
            <p className="mb-2 text-xs font-medium tracking-widest uppercase text-muted-foreground">
              {t("featured")}
            </p>
            {featured.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.coverImageUrl}
                alt=""
                className="mb-6 aspect-[21/9] w-full rounded-lg object-cover"
              />
            )}
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
          </Link>

          {rest.length > 0 && (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((story) => (
                <Link
                  key={story.slug}
                  href={`/stories/${story.slug}`}
                  className="group block"
                >
                  {story.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.coverImageUrl}
                      alt=""
                      className="mb-4 aspect-video w-full rounded-lg object-cover"
                    />
                  )}
                  <h3 className="font-heading text-2xl font-black uppercase group-hover:underline">
                    {story.title}
                  </h3>
                  {story.subtitle && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {story.subtitle}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {story.artistName ? `${story.artistName} · ` : ""}
                    {t("readTime", { minutes: story.readingTimeMinutes })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
