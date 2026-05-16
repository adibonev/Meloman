import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const INSTAGRAM_URL = "https://www.instagram.com/meloman.offc/";
const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61566868535472&locale=bg_BG";

/**
 * Public site footer: section links (so inner pages can navigate without
 * a section nav up top), socials (drive traffic to the Meloman pages),
 * and the audio fair-use disclaimer required by CLAUDE.md §4.6. Not
 * rendered on the distraction-free host/player surfaces.
 */
export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="font-heading text-lg font-black uppercase tracking-[0.15em] text-foreground">
              Meloman
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("explore")}
            </p>
            <Link
              href="/stories"
              className="text-sm text-foreground transition-colors hover:text-primary"
            >
              {nav("stories")}
            </Link>
            <Link
              href="/daily"
              className="text-sm text-foreground transition-colors hover:text-primary"
            >
              {nav("daily")}
            </Link>
            <Link
              href="/profile"
              className="text-sm text-foreground transition-colors hover:text-primary"
            >
              {nav("profile")}
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("followUs")}
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground transition-colors hover:text-primary"
            >
              Instagram
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground transition-colors hover:text-primary"
            >
              Facebook
            </a>
          </div>
        </div>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          {t("audioDisclaimer")}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">© {year} Meloman</p>
      </div>
    </footer>
  );
}
