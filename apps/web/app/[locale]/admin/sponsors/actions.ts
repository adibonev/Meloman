"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { sponsors } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { uploadObject } from "@/lib/r2";
import {
  SPONSOR_LOGO_ACCEPTED_MIME_TYPES,
  SPONSOR_LOGO_MAX_SIZE_BYTES,
  createSponsorSchema,
} from "@/lib/schemas/sponsor";

const LOGO_EXT_BY_MIME: Record<
  (typeof SPONSOR_LOGO_ACCEPTED_MIME_TYPES)[number],
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

type LogoErrorKey =
  | "logoTooLarge"
  | "logoWrongType"
  | "logoUploadFailed";

// If the form has a logo file, upload it to R2 and return the key.
// Returns null when there's no file (so the caller falls back to the
// URL field). Returns an errorKey on validation/upload failure so the
// caller can surface it.
async function maybeUploadLogo(
  formData: FormData
): Promise<
  | { ok: true; r2Key: string | null }
  | { errorKey: LogoErrorKey }
> {
  const logoFile = formData.get("logoFile");
  if (!(logoFile instanceof File) || logoFile.size === 0) {
    return { ok: true, r2Key: null };
  }
  if (logoFile.size > SPONSOR_LOGO_MAX_SIZE_BYTES) {
    return { errorKey: "logoTooLarge" };
  }
  const mime = logoFile.type as (typeof SPONSOR_LOGO_ACCEPTED_MIME_TYPES)[number];
  if (!SPONSOR_LOGO_ACCEPTED_MIME_TYPES.includes(mime)) {
    return { errorKey: "logoWrongType" };
  }
  const ext = LOGO_EXT_BY_MIME[mime];
  const key = `sponsor-logos/${randomUUID()}.${ext}`;
  try {
    const buffer = new Uint8Array(await logoFile.arrayBuffer());
    await uploadObject(key, buffer, mime);
  } catch (err) {
    console.error("R2 sponsor logo upload failed:", err);
    return { errorKey: "logoUploadFailed" };
  }
  return { ok: true, r2Key: key };
}

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

  const upload = await maybeUploadLogo(formData);
  if ("errorKey" in upload) return { errorKey: upload.errorKey };

  // R2 upload wins over URL — if both are provided, the file takes
  // priority and the URL is discarded. Admin chooses one path on the
  // form, but defensive in case both come through.
  await db.insert(sponsors).values({
    name: parsed.data.name,
    logoUrl: upload.r2Key ? null : parsed.data.logoUrl ?? null,
    logoR2Key: upload.r2Key,
  });

  const locale = await getLocale();
  redirect({ href: "/admin/sponsors", locale });
}

export async function updateSponsorAction(
  sponsorId: string,
  formData: FormData
) {
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

  const [existing] = await db
    .select({
      logoUrl: sponsors.logoUrl,
      logoR2Key: sponsors.logoR2Key,
    })
    .from(sponsors)
    .where(eq(sponsors.id, sponsorId))
    .limit(1);

  if (!existing) {
    return { errorKey: "notFound" as const };
  }

  const upload = await maybeUploadLogo(formData);
  if ("errorKey" in upload) return { errorKey: upload.errorKey };

  // Three branches:
  //   1. New file uploaded → store r2 key, clear logoUrl.
  //   2. No file but logoUrl provided → store url, clear r2 key.
  //   3. Neither, but clearLogo checked → clear both.
  //   4. Neither, no clearLogo → preserve the previous logo.
  // The "clearLogo" hidden input lets the form opt into branch 3
  // explicitly when a previous logo existed.
  const wantsClear = formData.get("clearLogo") === "1";
  let logoUrl: string | null = existing.logoUrl;
  let logoR2Key: string | null = existing.logoR2Key;
  if (upload.r2Key) {
    logoUrl = null;
    logoR2Key = upload.r2Key;
  } else if (parsed.data.logoUrl) {
    logoUrl = parsed.data.logoUrl;
    logoR2Key = null;
  } else if (wantsClear) {
    logoUrl = null;
    logoR2Key = null;
  }

  await db
    .update(sponsors)
    .set({
      name: parsed.data.name,
      logoUrl,
      logoR2Key,
    })
    .where(eq(sponsors.id, sponsorId));

  const locale = await getLocale();
  redirect({ href: "/admin/sponsors", locale });
}

export async function deleteSponsorAction(sponsorId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  // FK note: legacy quizzes.sponsorId is set null, while quiz_sponsors
  // rows cascade. No quiz or live session is deleted.
  await db.delete(sponsors).where(eq(sponsors.id, sponsorId));

  const locale = await getLocale();
  redirect({ href: "/admin/sponsors", locale });
}
