import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { gameSessions, quizzes, teams, users } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { ShareButtons } from "@/components/share-buttons";
import { SITE_URL } from "@/lib/site";
import { classifyEvent, eventStartMs } from "@/lib/event-status";
import { formatEventDateTime } from "@/lib/datetime";

async function loadEvent(id: string) {
  const [row] = await db
    .select({
      id: gameSessions.id,
      status: gameSessions.status,
      venue: gameSessions.venue,
      scheduledStartAt: gameSessions.scheduledStartAt,
      scheduledEndAt: gameSessions.scheduledEndAt,
      startedAt: gameSessions.startedAt,
      createdAt: gameSessions.createdAt,
      publicEvent: gameSessions.publicEvent,
      quizTitle: quizzes.title,
      host: users.displayName,
    })
    .from(gameSessions)
    .innerJoin(quizzes, eq(gameSessions.quizId, quizzes.id))
    .innerJoin(users, eq(gameSessions.hostId, users.id))
    .where(eq(gameSessions.id, id))
    .limit(1);
  return row && row.publicEvent ? row : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "Events" });
  const row = await loadEvent(id);
  return {
    title: row ? `${row.quizTitle} | Meloman` : t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const row = await loadEvent(id);
  if (!row) notFound();

  const t = await getTranslations("Events");
  const bucket = classifyEvent(row);
  const isPast = bucket === "past";
  const isLive = bucket === "live";

  const podium = isPast
    ? await db
        .select({
          name: teams.name,
          score: teams.totalScore,
          emoji: teams.avatarEmoji,
        })
        .from(teams)
        .where(eq(teams.sessionId, row.id))
        .orderBy(desc(teams.totalScore))
        .limit(3)
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link
        href="/events"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        {t("back")}
      </Link>

      <h1 className="mt-6 font-heading text-4xl font-black uppercase sm:text-5xl">
        {row.quizTitle}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {formatEventDateTime(new Date(eventStartMs(row)), locale)}
        {row.venue ? ` · ${row.venue}` : ""} · {t("host")}: {row.host}
        {isLive ? ` · ${t("live")}` : ""}
      </p>

      {podium.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {t("podium")}
          </h2>
          <ol className="mt-3 space-y-1">
            {podium.map((p, i) => (
              <li key={p.name}>
                {["🥇", "🥈", "🥉"][i]} {p.emoji} {p.name} —{" "}
                <span className="tabular-nums">{p.score}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!isPast && (
        <section className="mt-10 rounded-lg border border-border border-l-2 border-l-primary bg-card p-6">
          <h2 className="font-heading text-lg font-black uppercase">
            {t("howToTitle")}
          </h2>
          <ol className="mt-4 space-y-2 text-sm text-foreground/90">
            {(t.raw("howToSteps") as string[]).map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-heading text-primary tabular-nums">
                  {i + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <ShareButtons
        url={`${SITE_URL}${locale === "en" ? "/en" : ""}/events/${row.id}`}
      />
    </main>
  );
}
