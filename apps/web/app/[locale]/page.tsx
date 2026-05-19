import type { Metadata } from "next";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { gameSessions, quizzes, stories, users } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { auth } from "@/auth";
import { classifyEvent, eventStartMs } from "@/lib/event-status";
import { formatEventDateTime } from "@/lib/datetime";
import { SOCIAL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const t2 = await getTranslations("Events");
  const session = await auth();
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "super_admin";

  // Real "latest story" target so the card links to an actual article.
  const [latestStory] = await db
    .select({ slug: stories.slug, title: stories.title })
    .from(stories)
    .where(isNotNull(stories.publishedAt))
    .orderBy(desc(stories.publishedAt))
    .limit(1);

  // Upcoming + live public events for the homepage section. We fetch a
  // window, classify by time (lib/event-status) and keep only
  // upcoming/live, soonest first. Empty → section auto-hides.
  const eventRows = await db
    .select({
      id: gameSessions.id,
      status: gameSessions.status,
      venue: gameSessions.venue,
      scheduledStartAt: gameSessions.scheduledStartAt,
      scheduledEndAt: gameSessions.scheduledEndAt,
      startedAt: gameSessions.startedAt,
      createdAt: gameSessions.createdAt,
      quizTitle: quizzes.title,
      host: users.displayName,
    })
    .from(gameSessions)
    .innerJoin(quizzes, eq(gameSessions.quizId, quizzes.id))
    .innerJoin(users, eq(gameSessions.hostId, users.id))
    .where(eq(gameSessions.publicEvent, true))
    .orderBy(
      desc(sql`coalesce(${gameSessions.startedAt}, ${gameSessions.createdAt})`)
    )
    .limit(30);
  const upcomingEvents = eventRows
    .map((e) => ({ ...e, bucket: classifyEvent(e) }))
    .filter((e) => e.bucket === "upcoming" || e.bucket === "live")
    .sort((a, b) => eventStartMs(a) - eventStartMs(b))
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav minimal />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-16 sm:pt-24">
        <section className="flex flex-col items-center text-center">
          <h1 className="font-heading text-6xl font-black uppercase tracking-wide sm:text-8xl">
            Meloman
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/events"
              className={buttonVariants({ className: "h-11 px-8 text-sm" })}
            >
              {t("ctaEvents")}
            </Link>
            <Link
              href="/events"
              className={buttonVariants({
                variant: "secondary",
                className: "h-11 px-8 text-sm",
              })}
            >
              {t("ctaJoin")}
            </Link>
            {!session?.user && (
              <Link
                href="/register"
                className={buttonVariants({
                  variant: "secondary",
                  className: "h-11 px-8 text-sm",
                })}
              >
                {t("ctaRegister")}
              </Link>
            )}
          </div>
        </section>

        {upcomingEvents.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-2xl font-black uppercase">
                {t("vidinTitle")}
              </h2>
              <Link
                href="/events"
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t("vidinAll")}
              </Link>
            </div>
            <ul className="space-y-3">
              {upcomingEvents.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}`}
                    className="group flex flex-col gap-2 rounded-lg border border-border border-l-2 border-l-primary bg-card p-5 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-heading text-xl font-black uppercase">
                        {e.quizTitle}
                        {e.bucket === "live" && (
                          <span className="ml-3 align-middle text-xs font-semibold uppercase tracking-widest text-primary">
                            {t2("live")}
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatEventDateTime(
                          new Date(eventStartMs(e)),
                          locale
                        )}
                        {e.venue ? ` · ${e.venue}` : ""}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t2("host")}: {e.host}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-primary group-hover:underline">
                      {t2("viewEvent")} →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-20">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {t("exploreTitle")}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              href="/daily"
              title={t("cardDaily")}
              description={t("cardDailyDesc")}
            />
            <FeatureCard
              href={latestStory ? `/stories/${latestStory.slug}` : "/stories"}
              title={t("cardStory")}
              description={latestStory?.title ?? t("cardStoryDesc")}
            />
            {isAdmin ? (
              <FeatureCard
                href="/admin/quizzes"
                title={t("cardQuizAdmin")}
                description={t("cardQuizAdminDesc")}
              />
            ) : (
              <FeatureCard
                href="/profile"
                title={t("cardProfile")}
                description={t("cardProfileDesc")}
              />
            )}
          </div>
        </section>

        <section className="mt-20 rounded-lg border border-border border-l-2 border-l-primary bg-card p-6 text-center sm:p-8">
          <h2 className="font-heading text-2xl font-black uppercase">
            {t("venueTitle")}
          </h2>
          <a
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              className: "mt-5 h-11 px-8 text-sm",
            })}
          >
            {t("venueCta")}
          </a>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}

function FeatureCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-border border-l-2 border-l-primary bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-l-4 hover:bg-secondary"
    >
      <span className="font-heading text-2xl font-black tracking-wide uppercase text-foreground">
        {title}
      </span>
      <span className="mt-2 text-sm text-muted-foreground">{description}</span>
      <span className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary opacity-0 transition-opacity group-hover:opacity-100">
        →
      </span>
    </Link>
  );
}
