"use server";

import { joinAsAnonymousAction } from "./[code]/actions";

/**
 * Guest join from the /play hub (no code in the URL yet). Pulls the code
 * from the form and reuses the existing anonymous-join action, which
 * validates the session, mints a throwaway player, signs in and redirects
 * to /play/[code].
 */
export async function guestJoinHubAction(formData: FormData) {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (code.length < 4) {
    return { errorKey: "sessionNotFound" as const };
  }
  return joinAsAnonymousAction(code, formData);
}
