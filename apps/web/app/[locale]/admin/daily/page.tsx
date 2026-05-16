import { desc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { dailyContent } from "@meloman/db/schema";
import { Button } from "@/components/ui/button";
import { createDailyAction, deleteDailyAction } from "./actions";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

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

  async function create(formData: FormData) {
    "use server";
    await createDailyAction(formData);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
        {t("title")}
      </h1>

      <form
        action={create}
        className="space-y-4 rounded-lg border border-border p-6"
      >
        <h2 className="font-heading text-xl font-black uppercase">
          {t("newEntry")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-muted-foreground">{t("date")}</span>
            <input
              name="contentDate"
              type="date"
              required
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">{t("type")}</span>
            <select name="contentType" className={inputCls}>
              <option value="song_of_day">{t("song")}</option>
              <option value="mystery_artist">{t("mystery")}</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-muted-foreground">
            {t("payload")}
          </span>
          <textarea
            name="payload"
            required
            rows={8}
            defaultValue={SONG_TEMPLATE}
            className={`${inputCls} font-mono`}
          />
        </label>
        <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
          <div>
            <p className="mb-1">{t("songHint")}</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3">
              {SONG_TEMPLATE}
            </pre>
          </div>
          <div>
            <p className="mb-1">{t("mysteryHint")}</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3">
              {MYSTERY_TEMPLATE}
            </pre>
          </div>
        </div>
        <Button type="submit" size="lg">
          {t("save")}
        </Button>
      </form>

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
