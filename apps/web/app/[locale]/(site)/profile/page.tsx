import { desc, eq, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { badges, userBadges, userProgress } from "@meloman/db/schema";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { BadgeIcon } from "@/components/badge";
import { cn } from "@/lib/utils";
import { RegisterCta } from "@/components/register-cta";
import { StreakIndicator } from "@/components/streak-indicator";

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
      <main className="mx-auto max-w-xl px-4 py-24">
        <h1 className="font-heading text-5xl font-black uppercase">
          {t("title")}
        </h1>
        <div className="mt-10 rounded-lg border border-border border-l-2 border-l-primary bg-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("previewTitle")}
          </p>
          <ul className="mt-4 space-y-2">
            {(t.raw("previewItems") as string[]).map((item, i) => (
              <li key={i} className="flex gap-3 text-foreground">
                <span className="text-primary">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className={buttonVariants({ className: "h-11 px-8 text-sm" })}
          >
            {t("ctaLogin")}
          </Link>
          <Link
            href="/register"
            className={buttonVariants({
              variant: "secondary",
              className: "h-11 px-8 text-sm",
            })}
          >
            {t("ctaRegister")}
          </Link>
        </div>
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

  const allBadges = await db
    .select({
      slug: badges.slug,
      name: badges.name,
      description: badges.description,
      rarity: badges.rarity,
    })
    .from(badges)
    .orderBy(badges.createdAt);

  const earnedRows = await db
    .select({ slug: badges.slug })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId));
  const earnedSlugs = new Set(earnedRows.map((r) => r.slug));

  const totalXp = Number(xpRow?.totalXp ?? 0);
  const streak = streakRow?.streak ?? 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-5xl font-black tracking-wider uppercase sm:text-7xl">
          {t("title")}
        </h1>
        <StreakIndicator days={streak} />
      </div>

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
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-2xl font-black uppercase">
            {t("badges")}
          </h2>
          <span className="rounded-full border border-border px-3 py-1 text-sm font-semibold text-primary tabular-nums">
            {t("badgesCount", {
              earned: earnedSlugs.size,
              total: allBadges.length,
            })}
          </span>
        </div>
        {allBadges.length === 0 ? (
          <p className="mt-4 text-muted-foreground">{t("noBadges")}</p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {allBadges.map((b) => {
              const unlocked = earnedSlugs.has(b.slug);
              return (
                <li
                  key={b.slug}
                  className={cn(
                    "flex flex-col items-center rounded-lg border border-border p-4 text-center transition-all",
                    unlocked
                      ? "border-l-2 border-l-primary bg-card"
                      : "bg-card/40",
                  )}
                >
                  <BadgeIcon
                    slug={b.slug}
                    rarity={b.rarity}
                    unlocked={unlocked}
                    size="lg"
                    description={b.description ?? undefined}
                  />
                  <p
                    className={cn(
                      "mt-3 font-medium",
                      !unlocked && "text-muted-foreground",
                    )}
                  >
                    {b.name}
                  </p>
                  {b.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <RegisterCta />
    </main>
  );
}
