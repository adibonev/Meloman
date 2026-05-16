"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import { auth } from "@/auth";

const ROLES = ["player", "admin", "super_admin"] as const;
type Role = (typeof ROLES)[number];

async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== "super_admin") {
    return { ok: false as const, currentUserId: null };
  }
  return { ok: true as const, currentUserId: session.user.id };
}

export async function changeUserRoleAction(userId: string, role: string) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return { errorKey: "forbidden" as const };
  if (!ROLES.includes(role as Role)) {
    return { errorKey: "invalid" as const };
  }
  // A super_admin can't demote themselves — avoids locking the panel.
  if (userId === guard.currentUserId) {
    return { errorKey: "invalid" as const };
  }

  await db
    .update(users)
    .set({ role: role as Role })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function toggleBanAction(userId: string) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return { errorKey: "forbidden" as const };
  if (userId === guard.currentUserId) {
    return { errorKey: "invalid" as const };
  }

  const [target] = await db
    .select({ bannedAt: users.bannedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return { errorKey: "invalid" as const };

  await db
    .update(users)
    .set({ bannedAt: target.bannedAt ? null : new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
  return { ok: true as const };
}
