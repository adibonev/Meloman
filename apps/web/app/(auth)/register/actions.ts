"use server";

import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { registerSchema } from "@/lib/schemas/auth";

export async function registerAction(formData: FormData) {
  const raw = {
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Невалидни данни. Провери полетата." };
  }

  const { displayName, email, password } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "Имейлът вече е регистриран." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    displayName,
    passwordHash,
    role: "player",
  });

  redirect("/login?registered=1");
}
