import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";
import { auth, signOut } from "@/auth";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const session = await auth();

  return (
    <>
      <SiteNav />
      <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-10 text-center">
        <h1 className="font-heading text-7xl font-black tracking-[0.2em] text-foreground sm:text-8xl">
          MELOMAN
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          {t("tagline")}
        </p>

        {session?.user ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-base text-foreground">
              {t("welcome", { name: session.user.name ?? session.user.email ?? "" })}
            </p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: locale === "en" ? "/en" : "/" });
              }}
            >
              <Button type="submit" variant="secondary" size="lg">
                {t("logout")}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              {t("loginCta")}
            </Link>
            <Link
              href="/register"
              className={buttonVariants({ size: "lg", variant: "secondary" })}
            >
              {t("registerCta")}
            </Link>
          </div>
        )}
      </div>
      </main>
    </>
  );
}
