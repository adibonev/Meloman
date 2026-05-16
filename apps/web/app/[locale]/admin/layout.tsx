import { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/auth";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin");
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-heading text-2xl font-black tracking-widest text-foreground"
            >
              MELOMAN
            </Link>
            <span className="text-sm uppercase tracking-wider text-muted-foreground">
              {t("panelLabel")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.name ?? session?.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: locale === "en" ? "/en" : "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                {t("logout")}
              </Button>
            </form>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-6 px-6 pb-3 text-sm">
          <Link
            href="/admin/quizzes"
            className="text-foreground hover:underline"
          >
            {t("nav.quizzes")}
          </Link>
          <Link
            href="/admin/sponsors"
            className="text-foreground hover:underline"
          >
            {t("nav.sponsors")}
          </Link>
          <Link
            href="/admin/stories"
            className="text-foreground hover:underline"
          >
            {t("nav.stories")}
          </Link>
          <Link
            href="/admin/daily"
            className="text-foreground hover:underline"
          >
            {t("nav.daily")}
          </Link>
          <Link
            href="/admin/users"
            className="text-foreground hover:underline"
          >
            {t("nav.users")}
          </Link>
          <Link
            href="/admin/analytics"
            className="text-foreground hover:underline"
          >
            {t("nav.analytics")}
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
