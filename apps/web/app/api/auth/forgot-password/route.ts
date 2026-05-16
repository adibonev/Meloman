import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/guard";
import { getRequestOrigin } from "@/lib/origin";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { forgotPasswordSchema } from "@/lib/schemas/auth";

/**
 * POST /api/auth/forgot-password — email a reset link (CLAUDE.md §7.1).
 * Always returns 200: revealing whether an address exists would leak the
 * user list. The service is silent for unknown emails.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "A valid email is required.", 422);
  }

  await requestPasswordReset(parsed.data.email, await getRequestOrigin());
  return NextResponse.json({ ok: true });
}
