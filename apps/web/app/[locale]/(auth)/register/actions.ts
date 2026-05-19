"use server";

import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { registerSchema } from "@/lib/schemas/auth";
import { getRequestOrigin } from "@/lib/origin";
import {
  isVerificationEnforced,
  sendVerificationFor,
} from "@/lib/auth/email-verification";

export async function registerAction(formData: FormData) {
  const raw = {
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  const { displayName, email, password } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { errorKey: "emailTaken" as const };
  }

  const enforced = isVerificationEnforced();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    displayName,
    passwordHash,
    role: "player",
    // When verification isn't enforced (no owned/verified domain yet)
    // the account is usable immediately — no email needed, no lockout.
    emailVerified: !enforced,
  });

  const locale = await getLocale();
  if (!enforced) {
    redirect({ href: "/login?registered=1", locale });
  }

  // Enforced: email the confirmation link (graceful without Resend)
  // and gate login until it's confirmed.
  await sendVerificationFor(email, await getRequestOrigin());
  redirect({ href: "/verify-email?sent=1", locale });
}
