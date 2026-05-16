import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { dailyContent } from "@meloman/db/schema";

/**
 * GET /api/daily/today — today's Song of the Day / Mystery Artist (public).
 * Returns `{ daily: null }` when nothing is scheduled for the date.
 */
export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const [row] = await db
    .select({
      contentType: dailyContent.contentType,
      contentDate: dailyContent.contentDate,
      payload: dailyContent.payload,
    })
    .from(dailyContent)
    .where(eq(dailyContent.contentDate, today))
    .limit(1);

  return NextResponse.json({ daily: row ?? null });
}
