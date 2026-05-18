import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { dailyContent } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function loadRow(date: string) {
  if (!DATE_RE.test(date)) return null;
  const [row] = await db
    .select({
      contentType: dailyContent.contentType,
      payload: dailyContent.payload,
    })
    .from(dailyContent)
    .where(eq(dailyContent.contentDate, date))
    .limit(1);
  return row ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}): Promise<Metadata> {
  const { locale, date } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const row = await loadRow(date);
  if (!row) return { title: t("dailyFallbackTitle") };
  if (row.contentType === "song_of_day") {
    const p = row.payload as SongPayload;
    if (p.title && p.artist) {
      return {
        title: t("dailySongTitle", { title: p.title, artist: p.artist }),
        description: t("dailyDescription"),
      };
    }
  } else {
    const p = row.payload as MysteryPayload;
    if (p.name) {
      return {
        title: `${p.name}${t("storySuffix")}`,
        description: t("dailyDescription"),
      };
    }
  }
  return {
    title: t("dailyFallbackTitle"),
    description: t("dailyDescription"),
  };
}

export default async function DailyByDatePage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date } = await params;
  setRequestLocale(locale);
  const row = await loadRow(date);
  if (!row) notFound();

  const t = await getTranslations("Daily");
  const ta = await getTranslations("DailyArchive");
  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en" : "bg", {
    dateStyle: "long",
  });
  const isSong = row.contentType === "song_of_day";
  const song = row.payload as SongPayload;
  const mystery = row.payload as MysteryPayload;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      {isSong && song.title && song.artist && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "MusicRecording",
            name: song.title,
            byArtist: { "@type": "MusicGroup", name: song.artist },
          }}
        />
      )}

      <Link
        href="/daily/archive"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        {ta("back")}
      </Link>

      <p className="mt-6 text-sm uppercase tracking-[0.2em] text-primary">
        {fmt.format(new Date(`${date}T00:00:00`))}
        {" · "}
        {isSong ? t("songOfDay") : t("mysteryArtist")}
      </p>

      {isSong ? (
        <article className="mt-6">
          {song.albumCoverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={song.albumCoverUrl}
              alt={song.title ?? ""}
              className="aspect-square w-full max-w-sm rounded-lg object-cover"
            />
          )}
          <h1 className="mt-6 font-heading text-4xl font-black uppercase">
            {song.title ?? "—"}
          </h1>
          {song.artist && (
            <p className="mt-2 text-lg text-muted-foreground">
              {song.artist}
            </p>
          )}
          {song.story && (
            <p className="mt-6 leading-relaxed">{song.story}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {song.spotifyUri && (
              <a
                href={song.spotifyUri}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                {t("openSpotify")}
              </a>
            )}
            {song.youtubeUrl && (
              <a
                href={song.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                {t("openYoutube")}
              </a>
            )}
          </div>
        </article>
      ) : (
        <article className="mt-6">
          {mystery.blurredImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mystery.blurredImageUrl}
              alt={mystery.name ?? ""}
              className="aspect-square w-full max-w-sm rounded-lg object-cover"
            />
          )}
          <p className="mt-6 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {ta("answer")}
          </p>
          <h1 className="mt-1 font-heading text-4xl font-black uppercase">
            {mystery.name ?? "—"}
          </h1>
          {mystery.hints && mystery.hints.length > 0 && (
            <>
              <p className="mt-6 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                {ta("hints")}
              </p>
              <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                {mystery.hints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </>
          )}
          {mystery.story && (
            <p className="mt-6 leading-relaxed">{mystery.story}</p>
          )}
        </article>
      )}
    </main>
  );
}
