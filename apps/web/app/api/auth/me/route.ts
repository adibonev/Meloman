import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/guard";

/**
 * GET /api/auth/me — current authenticated user (id, email, name, role).
 *
 * The mobile app reuses this to bootstrap session state after reading the
 * JWT from secure storage.
 */
export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { user } = guard.session;
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      role: user.role,
    },
  });
}
