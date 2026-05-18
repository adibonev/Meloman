import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

/**
 * Soft conversion prompt on public content pages. Content stays public
 * (SEO + reach); this only nudges guests toward an account for quizzes,
 * streaks and badges. Renders nothing for signed-in users.
 */
type RegisterCtaVariant = "generic" | "stories" | "daily";

const SUBTITLE_KEY: Record<RegisterCtaVariant, string> = {
  generic: "subtitle",
  stories: "subtitleStories",
  daily: "subtitleDaily",
};

export async function RegisterCta({
  variant = "generic",
}: {
  variant?: RegisterCtaVariant;
}) {
  const session = await auth();
  if (session?.user) return null;

  const t = await getTranslations("RegisterCta");

  return (
    <div className="mx-auto mt-16 max-w-6xl px-4">
      <div className="flex flex-col gap-4 rounded-lg border border-border border-l-2 border-l-primary bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-xl font-black tracking-wide uppercase text-foreground">
            {t("title")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(SUBTITLE_KEY[variant])}
          </p>
        </div>
        <Link
          href="/register"
          className={buttonVariants({
            className: "h-11 shrink-0 px-6 text-sm",
          })}
        >
          {t("cta")}
        </Link>
      </div>
    </div>
  );
}
