import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@meloman/db";
import { dailyContent } from "@meloman/db/schema";
import { getPageParams, pageMeta } from "@/lib/pagination";

type SongPayload = { title?: string; artist?: string };
type MysteryPayload = { name?: string };

/**
 * GET /api/daily/archive — past Song-of-the-Day / Mystery Artist
 * entries for the mobile archive screen, paginated (`?page=&pageSize=`).
 * Returns a precomputed label so the client doesn't parse payload shape.
 */
export async function GET(request: Request) {
  const params = getPageParams(new URL(request.url).searchParams);

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: sql<number>`count(*)` }).from(dailyContent),
    db
      .select({
        contentDate: dailyContent.contentDate,
        contentType: dailyContent.contentType,
        payload: dailyContent.payload,
      })
      .from(dailyContent)
      .orderBy(desc(dailyContent.contentDate))
      .limit(params.limit)
      .offset(params.offset),
  ]);

  const items = rows.map((r) => {
    const isSong = r.contentType === "song_of_day";
    const label = isSong
      ? [(r.payload as SongPayload).title, (r.payload as SongPayload).artist]
          .filter(Boolean)
          .join(" — ")
      : ((r.payload as MysteryPayload).name ?? "");
    return {
      contentDate: r.contentDate,
      contentType: r.contentType,
      label: label || null,
    };
  });

  return NextResponse.json({ items, ...pageMeta(params, Number(total)) });
}
