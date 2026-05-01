import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-10 text-center">
        <h1 className="font-heading text-7xl font-black tracking-[0.2em] text-foreground sm:text-8xl">
          MELOMAN
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          {t("tagline")}
        </p>
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
      </div>
    </main>
  );
}
