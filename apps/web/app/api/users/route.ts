import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import { apiError, requireAdmin } from "@/lib/api/guard";
import { getPageParams, pageMeta } from "@/lib/pagination";

/**
 * GET /api/users — paginated user list (super-admin only, §4.1). This is
 * the endpoint that proves server-side paging holds up against the
 * 10k-row users table (SoftUni Scalability criterion) — never a full
 * dump.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  if (guard.session.user.role !== "super_admin") {
    return apiError("forbidden", "Super admin access required.", 403);
  }

  const params = getPageParams(new URL(request.url).searchParams);

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: sql<number>`count(*)` }).from(users),
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        bannedAt: users.bannedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(params.limit)
      .offset(params.offset),
  ]);

  return NextResponse.json({
    users: rows,
    ...pageMeta(params, Number(total)),
  });
}
