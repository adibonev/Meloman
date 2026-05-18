import type { Metadata } from "next";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { gameSessions, quizzes, teams, users } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { JoinCodeEntry } from "@/components/join-code-entry";

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

  const upcoming = rows.filter((r) => r.status !== "finished");
  const past = rows.filter((r) => r.status === "finished");

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

  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en" : "bg", {
    dateStyle: "long",
  });
  const dateOf = (r: (typeof rows)[number]) =>
    fmt.format(new Date(r.startedAt ?? r.createdAt));

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
                {r.status !== "lobby" ? ` · ${t("live")}` : ""}
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
