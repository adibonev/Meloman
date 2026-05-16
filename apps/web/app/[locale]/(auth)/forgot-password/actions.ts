"use server";

import { getRequestOrigin } from "@/lib/origin";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { forgotPasswordSchema } from "@/lib/schemas/auth";

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return { errorKey: "invalid" as const };

  // Always resolves the same way — the service is silent for unknown
  // addresses so we never leak which emails are registered.
  await requestPasswordReset(parsed.data.email, await getRequestOrigin());
  return { ok: true as const };
}
