import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { JoinCodeEntry } from "@/components/join-code-entry";
import { GuestHubJoin } from "./guest-hub-join";

/**
 * /play — the "Join a quiz" hub. Signed-in players go straight to a code
 * entry; signed-out visitors choose between signing in (keeps XP/streaks)
 * and continuing as a guest. Both paths land on /play/[code].
 */
export default async function PlayHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PlayHub");
  const session = await auth();

  return (
    <div className="mx-auto max-w-md space-y-8 px-4 py-16">
      <header className="text-center">
        <h1 className="font-heading text-4xl font-black uppercase tracking-wider">
          {t("title")}
        </h1>
      </header>

      {session?.user ? (
        <section className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {t("loggedInHint")}
          </p>
          <JoinCodeEntry placeholder={t("codePlaceholder")} cta={t("codeCta")} />
        </section>
      ) : (
        <section className="space-y-6">
          <p className="text-center text-sm text-muted-foreground">
            {t("chooseHint")}
          </p>

          <div className="rounded-lg border border-border border-l-2 border-l-primary bg-card p-5 text-center">
            <p className="font-heading text-lg font-black uppercase">
              {t("loginTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("loginHint")}
            </p>
            <Link
              href="/login"
              className={buttonVariants({ className: "mt-4 h-11 w-full text-sm" })}
            >
              {t("loginCta")}
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="rounded-lg border border-border p-5">
            <p className="font-heading text-lg font-black uppercase">
              {t("guestTitle")}
            </p>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              {t("guestHint")}
            </p>
            <GuestHubJoin />
          </div>
        </section>
      )}
    </div>
  );
}
