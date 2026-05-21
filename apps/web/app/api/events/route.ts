import { NextResponse } from "next/server";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@meloman/db";
import { gameSessions, quizzes, teams, users } from "@meloman/db/schema";
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
  const pastEvents = classified.filter((e) => e.bucket === "past");

  // Podium (top 3 teams) for past events — one query, mirroring the web
  // /events page so the mobile list can show the winners.
  const pastIds = pastEvents.map((p) => p.id);
  const podiumRows = pastIds.length
    ? await db
        .select({
          sessionId: teams.sessionId,
          name: teams.name,
          score: teams.totalScore,
          emoji: teams.avatarEmoji,
        })
        .from(teams)
        .where(inArray(teams.sessionId, pastIds))
        .orderBy(desc(teams.totalScore))
    : [];
  const podiumBySession = new Map<string, typeof podiumRows>();
  for (const row of podiumRows) {
    const list = podiumBySession.get(row.sessionId) ?? [];
    if (list.length < 3) list.push(row);
    podiumBySession.set(row.sessionId, list);
  }
  const past = pastEvents.map((e) => ({
    ...e,
    podium: (podiumBySession.get(e.id) ?? []).map((p) => ({
      name: p.name,
      score: p.score,
      emoji: p.emoji,
    })),
  }));

  return NextResponse.json({ upcoming, past });
}
