"use server";

import { performPasswordReset } from "@/lib/auth/password-reset";
import { resetPasswordSchema } from "@/lib/schemas/auth";

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { errorKey: "invalid" as const };

  const result = await performPasswordReset(
    parsed.data.token,
    parsed.data.password
  );
  if ("errorKey" in result) return { errorKey: "invalidToken" as const };
  return { ok: true as const };
}
