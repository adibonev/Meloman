import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/auth";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

/**
 * Global content nav. On the homepage (`minimal`) it shows only brand +
 * auth, because the hero cards already are the section navigation — no
 * duplication. On inner pages it also shows the section links so users
 * can move between sections without going home first. Not rendered on
 * the distraction-free host presentation or player game.
 */
export async function SiteNav({ minimal = false }: { minimal?: boolean }) {
  const t = await getTranslations("Nav");
  const session = await auth();
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "super_admin";

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meloman-logo-white.png"
            alt="Meloman"
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
          />
          <span className="text-lg font-semibold uppercase tracking-[0.15em]">
            Meloman
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {!minimal && (
            <>
              <Link
                href="/stories"
                className={buttonVariants({
                  variant: "ghost",
                  className: "h-9 px-3",
                })}
              >
                {t("stories")}
              </Link>
              <Link
                href="/daily"
                className={buttonVariants({
                  variant: "ghost",
                  className: "h-9 px-3",
                })}
              >
                {t("daily")}
              </Link>
            </>
          )}
          {session?.user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={buttonVariants({
                    variant: "secondary",
                    className: "h-9 px-4",
                  })}
                >
                  {t("admin")}
                </Link>
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className={buttonVariants({
                    variant: "ghost",
                    className: "h-9 px-4",
                  })}
                >
                  {t("logout")}
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ className: "h-9 px-5" })}
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
