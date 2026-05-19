import { NextResponse } from "next/server";
import { confirmEmail } from "@/lib/auth/email-verification";
import { getRequestOrigin } from "@/lib/origin";

/**
 * GET /api/auth/verify-email?token=… — confirm an email (CLAUDE.md
 * §7.1). Redirects to the locale-neutral login with a status flag so
 * the link works straight from an email client.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const result = await confirmEmail(token);
  const origin = await getRequestOrigin();
  const dest =
    "ok" in result
      ? `${origin}/login?verified=1`
      : `${origin}/verify-email?error=1`;
  return NextResponse.redirect(dest);
}
