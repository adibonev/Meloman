import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@meloman/db";
import { gameSessions, quizzes, users } from "@meloman/db/schema";
import { classifyEvent, eventStartMs } from "@/lib/event-status";

/**
 * GET /api/events — public quiz events for the mobile app. Same source
 * and time-based classification as the web /events page: upcoming +
 * live (soonest first) and past (most recent first).
 */
export async function GET() {
  const rows = await db
    .select({
      id: gameSessions.id,
      status: gameSessions.status,
      venue: gameSessions.venue,
      scheduledStartAt: gameSessions.scheduledStartAt,
      scheduledEndAt: gameSessions.scheduledEndAt,
      startedAt: gameSessions.startedAt,
      createdAt: gameSessions.createdAt,
      quizTitle: quizzes.title,
      host: users.displayName,
    })
    .from(gameSessions)
    .innerJoin(quizzes, eq(gameSessions.quizId, quizzes.id))
    .innerJoin(users, eq(gameSessions.hostId, users.id))
    .where(eq(gameSessions.publicEvent, true))
    .orderBy(
      desc(sql`coalesce(${gameSessions.startedAt}, ${gameSessions.createdAt})`)
    )
    .limit(60);

  const classified = rows.map((r) => ({
    id: r.id,
    quizTitle: r.quizTitle,
    venue: r.venue,
    host: r.host,
    startMs: eventStartMs(r),
    bucket: classifyEvent(r),
  }));

  const upcoming = classified
    .filter((e) => e.bucket === "upcoming" || e.bucket === "live")
    .sort((a, b) => a.startMs - b.startMs);
  const past = classified.filter((e) => e.bucket === "past");

  return NextResponse.json({ upcoming, past });
}
