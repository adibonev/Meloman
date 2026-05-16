import { eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { dailyContent } from "@meloman/db/schema";

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

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
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
    <section className="mt-12">
      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
        {t("songOfDay")}
      </p>
      {payload.albumCoverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={payload.albumCoverUrl}
          alt=""
          className="mt-4 aspect-square w-full max-w-sm rounded-lg object-cover"
        />
      )}
      <h2 className="mt-6 font-heading text-4xl font-black uppercase">
        {payload.title ?? "—"}
      </h2>
      <p className="mt-1 text-lg text-muted-foreground">{payload.artist}</p>
      {payload.story && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {t("story")}
          </summary>
          <p className="mt-4 leading-relaxed">{payload.story}</p>
        </details>
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
    <section className="mt-12">
      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
        {t("mysteryArtist")}
      </p>
      {payload.blurredImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={payload.blurredImageUrl}
          alt=""
          className="mt-4 aspect-square w-full max-w-sm rounded-lg object-cover blur-xl"
        />
      )}
      {payload.hints && payload.hints.length > 0 && (
        <ul className="mt-6 space-y-2">
          {payload.hints.map((hint, i) => (
            <li key={i} className="text-muted-foreground">
              {t("hint")} {i + 1}: {hint}
            </li>
          ))}
        </ul>
      )}
      <details className="mt-8">
        <summary className="cursor-pointer text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {t("revealAnswer")}
        </summary>
        <p className="mt-4 font-heading text-3xl font-black uppercase">
          {payload.name ?? "—"}
        </p>
        {payload.story && (
          <p className="mt-4 leading-relaxed">{payload.story}</p>
        )}
      </details>
    </section>
  );
}
