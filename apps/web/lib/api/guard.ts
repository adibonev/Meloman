import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { verifyMobileToken } from "@/lib/api/mobile-token";

/**
 * Shared auth guards for REST API route handlers.
 *
 * Why a helper: every endpoint repeats the same "signed in?" / "admin?"
 * checks with the project's standard error envelope
 * (`{ error: { code, message } }`). Centralizing it keeps routes short and
 * the error shape consistent across the 30+ endpoints.
 */
// `auth` is the overloaded Auth.js v5 universal handler, so
// `ReturnType<typeof auth>` resolves to the NextMiddleware overload, not the
// session. Use the (project-augmented) `Session` type directly instead.
export type ApiSession = Session;

type GuardResult =
  | { ok: true; session: ApiSession }
  | { ok: false; response: NextResponse };

export async function requireUser(): Promise<GuardResult> {
  // Web: Auth.js session cookie.
  const session = await auth();
  if (session?.user?.id) {
    return { ok: true, session };
  }

  // Mobile: Authorization: Bearer <jwt> (no cookie jar in React Native).
  const authHeader = (await headers()).get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const payload = verifyMobileToken(authHeader.slice(7).trim());
    if (payload) {
      const synthetic = {
        user: {
          id: payload.sub,
          role: payload.role,
          name: null,
          email: null,
        },
        expires: new Date(payload.exp * 1000).toISOString(),
      } as unknown as Session;
      return { ok: true, session: synthetic };
    }
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: { code: "unauthorized", message: "Not signed in." } },
      { status: 401 }
    ),
  };
}

export async function requireAdmin(): Promise<GuardResult> {
  const result = await requireUser();
  if (!result.ok) return result;

  const role = result.session.user.role;
  if (role !== "admin" && role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "forbidden", message: "Admin access required." } },
        { status: 403 }
      ),
    };
  }
  return result;
}

/** Standard JSON error envelope used by every REST endpoint. */
export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}
