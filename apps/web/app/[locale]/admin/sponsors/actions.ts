"use server";

import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { sponsors } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { createSponsorSchema } from "@/lib/schemas/sponsor";

export async function createSponsorAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  const parsed = createSponsorSchema.safeParse({
    name: formData.get("name"),
    logoUrl: formData.get("logoUrl") ?? "",
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  await db.insert(sponsors).values({
    name: parsed.data.name,
    logoUrl: parsed.data.logoUrl ?? null,
  });

  const locale = await getLocale();
  redirect({ href: "/admin/sponsors", locale });
}
