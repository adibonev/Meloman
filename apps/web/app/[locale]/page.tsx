import type { Metadata } from "next";
import { and, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { gameSessions, quizzes, stories, users } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { auth, signOut } from "@/auth";

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

  // Upcoming public events for the Vidin section. Empty → section
  // auto-hides (no scheduling model, so "upcoming" = public & live).
  const upcomingEvents = await db
    .select({
      id: gameSessions.id,
      venue: gameSessions.venue,
      startedAt: gameSessions.startedAt,
      createdAt: gameSessions.createdAt,
      quizTitle: quizzes.title,
      host: users.displayName,
    })
    .from(gameSessions)
    .innerJoin(quizzes, eq(gameSessions.quizId, quizzes.id))
    .innerJoin(users, eq(gameSessions.hostId, users.id))
    .where(
      and(
        eq(gameSessions.publicEvent, true),
        ne(gameSessions.status, "finished")
      )
    )
    .orderBy(
      desc(sql`coalesce(${gameSessions.startedAt}, ${gameSessions.createdAt})`)
    )
    .limit(3);
  const eventFmt = new Intl.DateTimeFormat(locale === "en" ? "en" : "bg", {
    dateStyle: "long",
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav minimal />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-16 sm:pt-24">
        <section className="flex flex-col items-center text-center">
          <h1 className="font-heading text-5xl font-black tracking-wide uppercase sm:text-7xl">
            Meloman
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("tagline")}
          </p>

          <div className="mt-8">
            {session?.user ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-base text-foreground">
                  {t("welcome", {
                    name: session.user.name ?? session.user.email ?? "",
                  })}
                </p>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: locale === "en" ? "/en" : "/" });
                  }}
                >
                  <Button
                    type="submit"
                    variant="secondary"
                    className="h-11 px-6 text-sm"
                  >
                    {t("logout")}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/login"
                  className={buttonVariants({ className: "h-11 px-8 text-sm" })}
                >
                  {t("loginCta")}
                </Link>
                <Link
                  href="/register"
                  className={buttonVariants({
                    variant: "secondary",
                    className: "h-11 px-8 text-sm",
                  })}
                >
                  {t("registerCta")}
                </Link>
              </div>
            )}
          </div>
        </section>

        {upcomingEvents.length > 0 && (
          <section className="mt-20">
            <div className="mb-6 flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {t("vidinTitle")}
              </p>
              <Link
                href="/events"
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t("vidinAll")}
              </Link>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {upcomingEvents.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}`}
                    className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-secondary"
                  >
                    <span className="font-medium">{e.quizTitle}</span>
                    <span className="text-sm text-muted-foreground">
                      {eventFmt.format(new Date(e.startedAt ?? e.createdAt))}
                      {e.venue ? ` · ${e.venue}` : ""} · {e.host}
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
