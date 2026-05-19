"use server";

import { getLocale } from "next-intl/server";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { isUnverified } from "@/lib/auth/email-verification";

export async function loginAction(formData: FormData) {
  const locale = await getLocale();
  const homePath = locale === "en" ? "/en" : "/";

  // Block real, not-yet-confirmed accounts before the credentials
  // provider runs. Anonymous quiz players are never gated.
  const email = String(formData.get("email") ?? "");
  if (email && (await isUnverified(email))) {
    return { errorKey: "unverified" as const };
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: homePath,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { errorKey: "credentials" as const };
        default:
          return { errorKey: "generic" as const };
      }
    }
    throw error;
  }
}
