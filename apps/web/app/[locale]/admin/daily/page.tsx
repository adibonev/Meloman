import { desc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { dailyContent } from "@meloman/db/schema";
import { Button } from "@/components/ui/button";
import { createDailyAction, deleteDailyAction } from "./actions";
import { DailyForm, type DailyResult } from "./daily-form";

// Static JSON templates shown to the admin. Kept out of next-intl on
// purpose: ICU treats `{` as an argument delimiter, so JSON literals must
// not go through t().
const SONG_TEMPLATE = `{
  "title": "Zombie",
  "artist": "The Cranberries",
  "albumCoverUrl": "https://...",
  "story": "Кратка история за песента...",
  "youtubeUrl": "https://youtube.com/...",
  "spotifyUri": "spotify:track:..."
}`;

const MYSTERY_TEMPLATE = `{
  "name": "Lady Gaga",
  "blurredImageUrl": "https://...",
  "hints": ["Родена 1986", "Американка", "Poker Face"],
  "story": "Кратка история за артиста..."
}`;

export default async function AdminDailyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminDaily");

  const rows = await db
    .select({
      id: dailyContent.id,
      contentDate: dailyContent.contentDate,
      contentType: dailyContent.contentType,
    })
    .from(dailyContent)
    .orderBy(desc(dailyContent.contentDate));

  async function create(
    _prev: DailyResult,
    formData: FormData
  ): Promise<DailyResult> {
    "use server";
    return createDailyAction(formData);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
        {t("title")}
      </h1>

      <DailyForm
        action={create}
        songTemplate={SONG_TEMPLATE}
        mysteryTemplate={MYSTERY_TEMPLATE}
        labels={{
          newEntry: t("newEntry"),
          date: t("date"),
          type: t("type"),
          song: t("song"),
          mystery: t("mystery"),
          payload: t("payload"),
          songHint: t("songHint"),
          mysteryHint: t("mysteryHint"),
          save: t("save"),
          saved: t("saved"),
          invalid: t("invalid"),
          forbidden: t("forbidden"),
        }}
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">{t("date")}</th>
                <th className="px-4 py-3 font-medium">{t("type")}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{r.contentDate}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.contentType === "song_of_day"
                      ? t("song")
                      : t("mystery")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await deleteDailyAction(r.id);
                      }}
                    >
                      <Button type="submit" size="sm" variant="destructive">
                        {t("delete")}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
