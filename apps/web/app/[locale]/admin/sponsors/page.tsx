import { asc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { sponsors } from "@meloman/db/schema";
import { SponsorCreateForm } from "./sponsor-create-form";

export default async function AdminSponsorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminSponsors");

  const all = await db
    .select({
      id: sponsors.id,
      name: sponsors.name,
      logoUrl: sponsors.logoUrl,
      createdAt: sponsors.createdAt,
    })
    .from(sponsors)
    .orderBy(asc(sponsors.createdAt));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>

      <SponsorCreateForm />

      <section className="space-y-3">
        <h2 className="font-heading text-xl uppercase tracking-wider">
          {t("existingTitle")}
        </h2>

        {all.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("emptyState")}
          </p>
        ) : (
          <ul className="space-y-2">
            {all.map((sponsor) => (
              <li
                key={sponsor.id}
                className="flex items-center gap-4 rounded-md border border-border bg-card px-4 py-3"
              >
                {sponsor.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary external host, intentionally not optimized
                  <img
                    src={sponsor.logoUrl}
                    alt=""
                    className="size-10 rounded object-contain"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-10 items-center justify-center rounded bg-muted text-xs uppercase tracking-widest text-muted-foreground"
                  >
                    {sponsor.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{sponsor.name}</p>
                  {sponsor.logoUrl && (
                    <p className="truncate text-xs text-muted-foreground">
                      {sponsor.logoUrl}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
