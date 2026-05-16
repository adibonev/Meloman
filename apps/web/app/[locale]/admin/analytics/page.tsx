import { isNotNull, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import {
  answers,
  gameSessions,
  quizzes,
  sponsors,
  stories,
  users,
} from "@meloman/db/schema";

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminAnalytics");

  const [
    [usersRow],
    [quizzesRow],
    [sessionsRow],
    [storiesRow],
    [publishedRow],
    [answersRow],
    [sponsorsRow],
    [viewsRow],
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(users),
    db.select({ c: sql<number>`count(*)` }).from(quizzes),
    db.select({ c: sql<number>`count(*)` }).from(gameSessions),
    db.select({ c: sql<number>`count(*)` }).from(stories),
    db
      .select({ c: sql<number>`count(*)` })
      .from(stories)
      .where(isNotNull(stories.publishedAt)),
    db.select({ c: sql<number>`count(*)` }).from(answers),
    db.select({ c: sql<number>`count(*)` }).from(sponsors),
    db.select({ v: sql<number>`coalesce(sum(${stories.viewCount}), 0)` }).from(
      stories
    ),
  ]);

  const cards: { label: string; value: number }[] = [
    { label: t("users"), value: Number(usersRow?.c ?? 0) },
    { label: t("quizzes"), value: Number(quizzesRow?.c ?? 0) },
    { label: t("sessions"), value: Number(sessionsRow?.c ?? 0) },
    { label: t("stories"), value: Number(storiesRow?.c ?? 0) },
    { label: t("publishedStories"), value: Number(publishedRow?.c ?? 0) },
    { label: t("answers"), value: Number(answersRow?.c ?? 0) },
    { label: t("sponsors"), value: Number(sponsorsRow?.c ?? 0) },
    { label: t("totalViews"), value: Number(viewsRow?.v ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
        {t("title")}
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border p-6 text-center"
          >
            <p className="font-heading text-4xl font-black">{c.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
