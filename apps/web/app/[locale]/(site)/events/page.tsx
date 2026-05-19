import type { Metadata } from "next";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { gameSessions, quizzes, teams, users } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { JoinCodeEntry } from "@/components/join-code-entry";
import { classifyEvent, eventStartMs } from "@/lib/event-status";
import { formatEventDateTime } from "@/lib/datetime";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Events" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Events");

  const rows = await db
    .select({
      id: gameSessions.id,
      status: gameSessions.status,
      venue: gameSessions.venue,
      scheduledStartAt: gameSessions.scheduledStartAt,
      scheduledEndAt: gameSessions.scheduledEndAt,
      startedAt: gameSessions.startedAt,
      createdAt: gameSessions.createdAt,
      quizTitle: quizzes.title,
      theme: quizzes.theme,
      host: users.displayName,
    })
    .from(gameSessions)
    .innerJoin(quizzes, eq(gameSessions.quizId, quizzes.id))
    .innerJoin(users, eq(gameSessions.hostId, users.id))
    .where(eq(gameSessions.publicEvent, true))
    .orderBy(desc(sql`coalesce(${gameSessions.startedAt}, ${gameSessions.createdAt})`))
    .limit(60);

  // Time-based classification (see lib/event-status). Upcoming + live
  // share the "upcoming" section (live carries a badge); upcoming is
  // sorted soonest-first, past most-recent-first.
  const classified = rows.map((r) => ({
    ...r,
    bucket: classifyEvent(r),
  }));
  const upcoming = classified
    .filter((r) => r.bucket === "upcoming" || r.bucket === "live")
    .sort((a, b) => eventStartMs(a) - eventStartMs(b));
  const past = classified.filter((r) => r.bucket === "past");

  // Podium for finished events: top 3 teams per session, one query.
  const pastIds = past.map((p) => p.id);
  const podiumRows = pastIds.length
    ? await db
        .select({
          sessionId: teams.sessionId,
          name: teams.name,
          score: teams.totalScore,
          emoji: teams.avatarEmoji,
        })
        .from(teams)
        .where(inArray(teams.sessionId, pastIds))
        .orderBy(desc(teams.totalScore))
    : [];
  const podiumBySession = new Map<string, typeof podiumRows>();
  for (const row of podiumRows) {
    const list = podiumBySession.get(row.sessionId) ?? [];
    if (list.length < 3) list.push(row);
    podiumBySession.set(row.sessionId, list);
  }

  const dateOf = (r: (typeof classified)[number]) =>
    formatEventDateTime(new Date(eventStartMs(r)), locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-5xl font-black tracking-wider uppercase sm:text-7xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-muted-foreground">{t("subtitle")}</p>

      <section className="mt-10 rounded-lg border border-border border-l-2 border-l-primary bg-card p-6">
        <p className="font-heading text-lg font-black uppercase">
          {t("joinTitle")}
        </p>
        <div className="mt-4">
          <JoinCodeEntry
            placeholder={t("joinPlaceholder")}
            cta={t("joinCta")}
          />
        </div>
      </section>

      <h2 className="mt-12 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {t("upcoming")}
      </h2>
      {upcoming.length === 0 ? (
        <p className="mt-4 text-muted-foreground">{t("noUpcoming")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {upcoming.map((r) => (
            <li key={r.id} className="py-4">
              <Link
                href={`/events/${r.id}`}
                className="font-medium hover:text-primary"
              >
                {r.quizTitle}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {dateOf(r)}
                {r.venue ? ` · ${r.venue}` : ""} · {t("host")}: {r.host}
                {r.bucket === "live" ? ` · ${t("live")}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-12 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {t("past")}
      </h2>
      {past.length === 0 ? (
        <p className="mt-4 text-muted-foreground">{t("noPast")}</p>
      ) : (
        <ul className="mt-4 space-y-6">
          {past.map((r) => {
            const podium = podiumBySession.get(r.id) ?? [];
            return (
              <li
                key={r.id}
                className="rounded-lg border border-border p-5"
              >
                <Link
                  href={`/events/${r.id}`}
                  className="font-medium hover:text-primary"
                >
                  {r.quizTitle}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dateOf(r)}
                  {r.venue ? ` · ${r.venue}` : ""} · {t("host")}: {r.host}
                </p>
                {podium.length > 0 && (
                  <ol className="mt-3 space-y-1 text-sm">
                    {podium.map((p, i) => (
                      <li key={p.name}>
                        {["🥇", "🥈", "🥉"][i]} {p.emoji} {p.name} —{" "}
                        <span className="tabular-nums">{p.score}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
