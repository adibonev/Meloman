"use server";

import { getLocale } from "next-intl/server";
import { signIn } from "@/auth";

/**
 * Start an OAuth sign-in. The provider is only ever rendered when its
 * env credentials exist (see configuredOauthProviders), so this is
 * never reachable for an unconfigured provider.
 */
export async function signInWithProvider(provider: "google" | "facebook") {
  const locale = await getLocale();
  await signIn(provider, { redirectTo: locale === "en" ? "/en" : "/" });
}
