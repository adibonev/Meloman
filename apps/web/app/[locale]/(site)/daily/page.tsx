import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { dailyContent } from "@meloman/db/schema";
import { mysteryStageNow } from "@/lib/daily-stage";
import { RegisterCta } from "@/components/register-cta";
import { JsonLd } from "@/components/json-ld";

type SongPayload = {
  title?: string;
  artist?: string;
  albumCoverUrl?: string;
  story?: string;
  youtubeUrl?: string;
  spotifyUri?: string;
};

type MysteryPayload = {
  name?: string;
  blurredImageUrl?: string;
  hints?: string[];
  story?: string;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const [row] = await db
    .select()
    .from(dailyContent)
    .where(eq(dailyContent.contentDate, todayIsoDate()))
    .limit(1);
  let title = t("dailyFallbackTitle");
  if (row?.contentType === "song_of_day") {
    const p = row.payload as SongPayload;
    if (p.title && p.artist) {
      title = t("dailySongTitle", { title: p.title, artist: p.artist });
    }
  }
  return { title, description: t("dailyDescription") };
}

export default async function DailyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Daily");

  const [row] = await db
    .select()
    .from(dailyContent)
    .where(eq(dailyContent.contentDate, todayIsoDate()))
    .limit(1);

  const songMeta =
    row?.contentType === "song_of_day"
      ? (row.payload as SongPayload)
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      {songMeta?.title && songMeta.artist && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "MusicRecording",
            name: songMeta.title,
            byArtist: { "@type": "MusicGroup", name: songMeta.artist },
          }}
        />
      )}
      <h1 className="font-heading text-5xl font-black tracking-wider uppercase sm:text-7xl">
        {t("title")}
      </h1>

      {!row ? (
        <div className="mt-12 rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">{t("noContent")}</p>
        </div>
      ) : row.contentType === "song_of_day" ? (
        <SongCard t={t} payload={row.payload as SongPayload} />
      ) : (
        <MysteryCard t={t} payload={row.payload as MysteryPayload} />
      )}
      <RegisterCta variant="daily" />
    </main>
  );
}

function SongCard({
  t,
  payload,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"Daily">>>;
  payload: SongPayload;
}) {
  return (
    <section className="mt-12 overflow-hidden rounded-lg border border-border border-l-2 border-l-primary bg-card">
      <div className="flex flex-col gap-8 p-6 sm:flex-row sm:p-8">
        <div className="shrink-0">
          {payload.albumCoverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={payload.albumCoverUrl}
              alt=""
              className="aspect-square w-full rounded-lg object-cover sm:w-56"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-secondary sm:w-56">
              <span className="font-heading text-6xl text-muted-foreground">
                ♪
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary">
            {t("songOfDay")}
          </p>
          <h2 className="mt-3 font-heading text-4xl font-black uppercase">
            {payload.title ?? "—"}
          </h2>
          <p className="mt-1 text-lg text-muted-foreground">
            {payload.artist}
          </p>
          {(payload.spotifyUri || payload.youtubeUrl) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {payload.spotifyUri && (
                <a
                  href={payload.spotifyUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  {t("openSpotify")}
                </a>
              )}
              {payload.youtubeUrl && (
                <a
                  href={payload.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  {t("openYoutube")}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      {payload.story && (
        <div className="border-t border-border p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground">
            {t("story")}
          </p>
          <p className="mt-4 leading-relaxed whitespace-pre-line text-foreground/90">
            {payload.story}
          </p>
        </div>
      )}
    </section>
  );
}

function MysteryCard({
  t,
  payload,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"Daily">>>;
  payload: MysteryPayload;
}) {
  return (
    <section className="mt-12 overflow-hidden rounded-lg border border-border border-l-2 border-l-primary bg-card">
      <div className="flex flex-col gap-8 p-6 sm:flex-row sm:p-8">
        <div className="shrink-0">
          {payload.blurredImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={payload.blurredImageUrl}
              alt=""
              className="aspect-square w-full rounded-lg object-cover blur-xl sm:w-56"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-secondary sm:w-56">
              <span className="font-heading text-6xl text-muted-foreground">
                ?
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary">
            {t("mysteryArtist")}
          </p>
          {(() => {
            const hints = payload.hints ?? [];
            const stage = mysteryStageNow(new Date(), hints.length);
            const shown = hints.slice(0, stage.revealedHints);
            return (
              <>
                {shown.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {shown.map((hint, i) => (
                      <li key={i} className="text-muted-foreground">
                        {t("hint")} {i + 1}: {hint}
                      </li>
                    ))}
                  </ul>
                )}

                {stage.answerRevealed ? (
                  <div className="mt-6">
                    <p className="font-heading text-3xl font-black uppercase">
                      {payload.name ?? "—"}
                    </p>
                    {payload.story && (
                      <p className="mt-4 leading-relaxed whitespace-pre-line text-foreground/90">
                        {payload.story}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-6 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                    {t("guessForXp", { xp: stage.xp })}
                    {" · "}
                    {t("answerLockedUntil")}
                  </p>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
