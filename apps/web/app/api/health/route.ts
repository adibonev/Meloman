import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@meloman/db";

/**
 * GET /api/health — liveness + DB connectivity probe.
 *
 * Used by the Vercel cron keep-alive ping to avoid cold starts and to
 * verify the Neon connection. Returns 503 if the DB round-trip fails so
 * monitoring can distinguish "app up" from "app up but DB unreachable".
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok", db: "up" });
  } catch (err) {
    console.error("Health check DB probe failed:", err);
    return NextResponse.json(
      { status: "degraded", db: "down" },
      { status: 503 }
    );
  }
}
