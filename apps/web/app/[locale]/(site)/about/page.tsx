import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SOCIAL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");

  const surfaces = [
    t("surfaceTv"),
    t("surfacePhone"),
    t("surfaceMobile"),
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-5xl font-black tracking-wider uppercase sm:text-7xl">
        {t("title")}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        {t("intro")}
      </p>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-black uppercase">
          {t("whoTitle")}
        </h2>
        <p className="mt-3 leading-relaxed">{t("who")}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-black uppercase">
          {t("forWhoTitle")}
        </h2>
        <p className="mt-3 leading-relaxed">{t("forWho")}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-black uppercase">
          {t("surfacesTitle")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {surfaces.map((s) => (
            <div
              key={s}
              className="rounded-lg border border-border border-l-2 border-l-primary bg-card p-5 text-sm leading-relaxed"
            >
              {s}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-black uppercase">
          {t("contactTitle")}
        </h2>
        <p className="mt-3 leading-relaxed">{t("contact")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            {t("followInstagram")}
          </a>
          <a
            href={SOCIAL.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            {t("followFacebook")}
          </a>
        </div>
      </section>
    </main>
  );
}
