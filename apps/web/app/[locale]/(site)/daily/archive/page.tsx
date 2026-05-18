import type { Metadata } from "next";
import { desc, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { dailyContent } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { PaginationNav } from "@/components/pagination-nav";
import { getPageParams, pageMeta } from "@/lib/pagination";

type SongPayload = { title?: string; artist?: string };
type MysteryPayload = { name?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DailyArchive" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function DailyArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("DailyArchive");
  const td = await getTranslations("Daily");

  const pageParams = getPageParams(await searchParams);
  const [[{ total }], rows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(dailyContent),
    db
      .select({
        contentDate: dailyContent.contentDate,
        contentType: dailyContent.contentType,
        payload: dailyContent.payload,
      })
      .from(dailyContent)
      .orderBy(desc(dailyContent.contentDate))
      .limit(pageParams.limit)
      .offset(pageParams.offset),
  ]);
  const meta = pageMeta(pageParams, Number(total));

  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en" : "bg", {
    dateStyle: "long",
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-5xl font-black tracking-wider uppercase sm:text-7xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-muted-foreground">{t("subtitle")}</p>

      {rows.length === 0 ? (
        <p className="mt-12 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-10 divide-y divide-border">
          {rows.map((r) => {
            const isSong = r.contentType === "song_of_day";
            const label = isSong
              ? [
                  (r.payload as SongPayload).title,
                  (r.payload as SongPayload).artist,
                ]
                  .filter(Boolean)
                  .join(" — ")
              : ((r.payload as MysteryPayload).name ?? "");
            return (
              <li
                key={r.contentDate}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {fmt.format(new Date(`${r.contentDate}T00:00:00`))}
                    {" · "}
                    {isSong ? td("songOfDay") : td("mysteryArtist")}
                  </p>
                  <p className="font-medium">{label || "—"}</p>
                </div>
                <Link
                  href={`/daily/${r.contentDate}`}
                  className="shrink-0 text-sm font-semibold text-primary hover:underline"
                >
                  {t("open")} →
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <PaginationNav
        basePath="/daily/archive"
        page={meta.page}
        totalPages={meta.totalPages}
      />
    </main>
  );
}
