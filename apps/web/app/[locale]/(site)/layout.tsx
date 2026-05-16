import { setRequestLocale } from "next-intl/server";
import { SiteNav } from "@/components/site-nav";

/**
 * Shared chrome for public content routes (stories, daily, profile,
 * artists). The `(site)` route group adds this nav without changing URLs.
 * Host presentation and player game stay outside it on purpose.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}
