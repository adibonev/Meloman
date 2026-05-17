import { desc, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { stories } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PaginationNav } from "@/components/pagination-nav";
import { getPageParams, pageMeta } from "@/lib/pagination";

export default async function AdminStoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminStories");

  const pageParams = getPageParams(await searchParams);
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: sql<number>`count(*)` }).from(stories),
    db
      .select({
        id: stories.id,
        slug: stories.slug,
        title: stories.title,
        publishedAt: stories.publishedAt,
        viewCount: stories.viewCount,
      })
      .from(stories)
      .orderBy(desc(stories.createdAt))
      .limit(pageParams.limit)
      .offset(pageParams.offset),
  ]);
  const meta = pageMeta(pageParams, Number(total));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
          {t("title")}
        </h1>
        <Link
          href="/admin/stories/new"
          className={buttonVariants({ size: "lg" })}
        >
          {t("newStory")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">{t("storyTitle")}</th>
                <th className="px-4 py-3 font-medium">{t("status")}</th>
                <th className="px-4 py-3 font-medium">{t("views")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/stories/${s.id}`}
                      className="text-foreground hover:underline"
                    >
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.publishedAt ? t("published") : t("draft")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.viewCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationNav
        basePath="/admin/stories"
        page={meta.page}
        totalPages={meta.totalPages}
      />
    </div>
  );
}
