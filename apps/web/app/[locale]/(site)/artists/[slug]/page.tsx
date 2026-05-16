import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { stories } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";

/**
 * Artist spotlight. The slug is the artist name lowercased with spaces →
 * hyphens (e.g. "leonard-cohen"). We match against stories.artist_name so
 * no separate artists table is needed for the MVP.
 */
function slugToName(slug: string): string {
  return slug.replace(/-/g, " ");
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ArtistPage");

  const name = slugToName(slug);

  const rows = await db
    .select({
      slug: stories.slug,
      title: stories.title,
      subtitle: stories.subtitle,
      artistName: stories.artistName,
      readingTimeMinutes: stories.readingTimeMinutes,
    })
    .from(stories)
    .where(
      and(
        isNotNull(stories.publishedAt),
        eq(stories.artistName, name)
      )
    )
    .orderBy(desc(stories.publishedAt));

  const displayName = rows[0]?.artistName ?? name;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          {t("title", { name: "" }).trim() || "Artist"}
        </p>
        <h1 className="mt-2 font-heading text-5xl font-black tracking-wide uppercase capitalize sm:text-7xl">
          {displayName}
        </h1>
      </header>

      <h2 className="font-heading text-2xl font-black uppercase">
        {t("storiesAbout", { name: displayName })}
      </h2>

      {rows.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {rows.map((s) => (
            <li key={s.slug} className="py-5">
              <Link
                href={`/stories/${s.slug}`}
                className="group block"
              >
                <h3 className="font-heading text-xl font-black uppercase group-hover:underline">
                  {s.title}
                </h3>
                {s.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.subtitle}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
