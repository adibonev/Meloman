import { desc, eq, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { badges, userBadges, userProgress } from "@meloman/db/schema";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Profile");
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-heading text-4xl font-black uppercase">
          {t("title")}
        </h1>
        <p className="mt-6 text-muted-foreground">{t("notSignedIn")}</p>
        <Link
          href="/login"
          className={buttonVariants({ size: "lg", className: "mt-8" })}
        >
          {t("title")}
        </Link>
      </main>
    );
  }

  const userId = session.user.id;

  const [xpRow] = await db
    .select({ totalXp: sql<number>`coalesce(sum(${userProgress.dailyXp}), 0)` })
    .from(userProgress)
    .where(eq(userProgress.userId, userId));

  const [streakRow] = await db
    .select({ streak: userProgress.streakCountAtDay })
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.date))
    .limit(1);

  const earned = await db
    .select({
      slug: badges.slug,
      name: badges.name,
      description: badges.description,
      iconUrl: badges.iconUrl,
      earnedAt: userBadges.earnedAt,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));

  const totalXp = Number(xpRow?.totalXp ?? 0);
  const streak = streakRow?.streak ?? 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-5xl font-black tracking-wider uppercase sm:text-7xl">
        {t("title")}
      </h1>

      <div className="mt-10 rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground">{t("signedInAs")}</p>
        <p className="text-xl font-medium">
          {session.user.name ?? session.user.email}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("role")}: {session.user.role}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="font-heading text-5xl font-black">{streak}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("streak")} · {t("days", { count: streak })}
          </p>
        </div>
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="font-heading text-5xl font-black">{totalXp}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("xp")}</p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-black uppercase">
          {t("badges")}
        </h2>
        {earned.length === 0 ? (
          <p className="mt-4 text-muted-foreground">{t("noBadges")}</p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {earned.map((b) => (
              <li
                key={b.slug}
                className="rounded-lg border border-border p-4 text-center"
              >
                {b.iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.iconUrl}
                    alt=""
                    className="mx-auto mb-2 h-12 w-12"
                  />
                )}
                <p className="font-medium">{b.name}</p>
                {b.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
