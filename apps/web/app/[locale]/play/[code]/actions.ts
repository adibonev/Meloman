"use server";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { gameSessions, users } from "@meloman/db/schema";
import { auth, signIn } from "@/auth";
import { redirect } from "@/i18n/navigation";
import {
  createTeam,
  joinTeam,
  submitTeamAnswer,
  transferCaptain,
  type CaptainTransferErrorKey,
  type SubmitAnswerErrorKey,
} from "@/lib/live-quiz/play-service";
import {
  createTeamSchema,
  joinAsAnonymousSchema,
  joinTeamSchema,
  submitAnswerSchema,
  transferCaptainSchema,
} from "@/lib/schemas/play";

// createTeamAction / joinTeamAction intentionally have no explicit return
// type: the success path ends in next-intl `redirect()`, whose type is not
// `never`, so annotating the Promise makes TS flag a missing return. The
// caller only checks `"errorKey" in result`, so inference is enough.
type SubmitAnswerActionResult =
  | { errorKey: "unauthorized" | "invalidData" | SubmitAnswerErrorKey }
  | { ok: true };

type TransferCaptainActionResult =
  | { errorKey: "unauthorized" | "invalidData" | CaptainTransferErrorKey }
  | { ok: true };

/**
 * Captain hands the role to a teammate from the lobby. Stays on the
 * page (no redirect) — the client refreshes and the Pusher broadcast
 * updates the other teammates' lobbies.
 */
export async function transferCaptainAction(
  code: string,
  formData: FormData
): Promise<TransferCaptainActionResult> {
  const userSession = await auth();
  if (!userSession?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }

  const parsed = transferCaptainSchema.safeParse({
    teamId: formData.get("teamId"),
    targetUserId: formData.get("targetUserId"),
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  const result = await transferCaptain(userSession.user.id, code, parsed.data);
  if ("errorKey" in result) return { errorKey: result.errorKey };
  return { ok: true as const };
}

// Player flow: anonymous user joins a live session. We mint a throwaway
// users row (never reused — random email + random password) and sign the
// browser in via the same Credentials provider the rest of the app uses,
// so role-based queries and `auth()` keep working uniformly.
export async function joinAsAnonymousAction(code: string, formData: FormData) {
  const upperCode = code.toUpperCase();

  const parsed = joinAsAnonymousSchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  // Make sure the session is real and still accepting players.
  const [row] = await db
    .select({ id: gameSessions.id, status: gameSessions.status })
    .from(gameSessions)
    .where(eq(gameSessions.joinCode, upperCode))
    .limit(1);

  if (!row) {
    return { errorKey: "sessionNotFound" as const };
  }
  if (row.status !== "lobby") {
    return { errorKey: "sessionNotJoinable" as const };
  }

  // Random throwaway credentials. The user can never log back in with these
  // — they only exist to give the JWT something to point at. Sessions are
  // single-browser anyway.
  const anonId = randomUUID();
  const email = `anon-${anonId}@meloman.local`;
  const password = randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    displayName: parsed.data.displayName,
    role: "player",
    emailVerified: false,
  });

  // Auth.js v5 quirk: signIn(..., { redirectTo }) from a Server Action
  // sometimes silently falls back to "/" when the path isn't recognised as
  // a trusted callback. Disabling its redirect and routing through
  // next-intl's locale-aware redirect ourselves makes this deterministic.
  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  const locale = await getLocale();
  redirect({ href: `/play/${upperCode}`, locale });
}

export async function createTeamAction(code: string, formData: FormData) {
  const userSession = await auth();
  if (!userSession?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    deviceFingerprint: formData.get("deviceFingerprint"),
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  const result = await createTeam(userSession.user.id, code, parsed.data);
  if ("errorKey" in result) return { errorKey: result.errorKey };

  const locale = await getLocale();
  redirect({ href: `/play/${result.code}/lobby`, locale });
}

export async function joinTeamAction(code: string, formData: FormData) {
  const userSession = await auth();
  if (!userSession?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }

  const parsed = joinTeamSchema.safeParse({
    teamId: formData.get("teamId"),
    deviceFingerprint: formData.get("deviceFingerprint"),
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  const result = await joinTeam(userSession.user.id, code, parsed.data);
  if ("errorKey" in result) return { errorKey: result.errorKey };

  const locale = await getLocale();
  redirect({ href: `/play/${result.code}/lobby`, locale });
}

export async function submitAnswerAction(
  code: string,
  formData: FormData
): Promise<SubmitAnswerActionResult> {
  const userSession = await auth();
  if (!userSession?.user?.id) {
    return { errorKey: "unauthorized" };
  }

  const parsed = submitAnswerSchema.safeParse({
    questionType: formData.get("questionType"),
    optionIndex: formData.get("optionIndex"),
    textAnswer: formData.get("textAnswer"),
    lyricAnswers: formData.getAll("lyricAnswers"),
    decade: formData.get("decade"),
    year: formData.get("year"),
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  return submitTeamAnswer(userSession.user.id, code, parsed.data);
}
