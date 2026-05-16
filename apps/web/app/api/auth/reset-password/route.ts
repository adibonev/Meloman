import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/guard";
import { performPasswordReset } from "@/lib/auth/password-reset";
import { resetPasswordSchema } from "@/lib/schemas/auth";

/**
 * POST /api/auth/reset-password — consume a reset token and set the new
 * password (CLAUDE.md §7.1). No auth: the signed token is the
 * authorization. 400 on an expired / already-used / forged token.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "Token and a valid password are required.", 422);
  }

  const result = await performPasswordReset(
    parsed.data.token,
    parsed.data.password
  );
  if ("errorKey" in result) {
    return apiError("invalidToken", "This reset link is invalid or expired.", 400);
  }
  return NextResponse.json({ ok: true });
}
