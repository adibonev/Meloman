import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

/**
 * Server-rendered prev/next pager for the admin + public list pages.
 * Pure links (no client JS) so it works in Server Components and keeps
 * the URL the source of truth. Renders nothing for a single page.
 */
export async function PaginationNav({
  basePath,
  page,
  totalPages,
  extraQuery,
}: {
  /** Locale-relative path, e.g. "/admin/users" or "/stories". */
  basePath: string;
  page: number;
  totalPages: number;
  /** Preserved alongside `page` (e.g. an active filter). */
  extraQuery?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;
  const t = await getTranslations("Pagination");

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const linkCls = buttonVariants({ variant: "outline", className: "h-9 px-4" });
  const disabledCls =
    "h-9 px-4 inline-flex items-center rounded-md border border-border text-sm text-muted-foreground opacity-50 pointer-events-none";

  return (
    <nav
      className="flex items-center justify-between gap-3 pt-6"
      aria-label="Pagination"
    >
      {prevDisabled ? (
        <span className={disabledCls}>{t("previous")}</span>
      ) : (
        <Link
          href={{ pathname: basePath, query: { ...extraQuery, page: page - 1 } }}
          className={linkCls}
          rel="prev"
        >
          {t("previous")}
        </Link>
      )}

      <span className="text-sm text-muted-foreground tabular-nums">
        {t("pageOf", { page, total: totalPages })}
      </span>

      {nextDisabled ? (
        <span className={disabledCls}>{t("next")}</span>
      ) : (
        <Link
          href={{ pathname: basePath, query: { ...extraQuery, page: page + 1 } }}
          className={linkCls}
          rel="next"
        >
          {t("next")}
        </Link>
      )}
    </nav>
  );
}
