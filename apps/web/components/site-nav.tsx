import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";

/**
 * Global content nav. Rendered on public/content pages (not on the
 * fullscreen host presentation or the player game, which are
 * distraction-free by design).
 */
export async function SiteNav() {
  const t = await getTranslations("Nav");
  const session = await auth();
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "super_admin";

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-heading text-xl font-black tracking-[0.2em] uppercase"
        >
          Meloman
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/stories" className="hover:underline">
            {t("stories")}
          </Link>
          <Link href="/daily" className="hover:underline">
            {t("daily")}
          </Link>
          {session?.user ? (
            <>
              <Link href="/profile" className="hover:underline">
                {t("profile")}
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:underline">
                  {t("admin")}
                </Link>
              )}
            </>
          ) : (
            <Link href="/login" className="hover:underline">
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
