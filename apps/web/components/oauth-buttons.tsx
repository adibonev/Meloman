import { getTranslations } from "next-intl/server";
import { configuredOauthProviders } from "@/auth";
import { signInWithProvider } from "@/app/[locale]/(auth)/oauth-actions";
import { Button } from "@/components/ui/button";

/**
 * OAuth sign-in buttons. Renders nothing until a provider's
 * credentials are present in the environment, so Google/Facebook ship
 * dark and light up the moment real keys are added (no broken buttons).
 */
export async function OauthButtons() {
  const providers = configuredOauthProviders();
  if (providers.length === 0) return null;

  const t = await getTranslations("Oauth");
  const label: Record<"google" | "facebook", string> = {
    google: "Google",
    facebook: "Facebook",
  };

  return (
    <div className="mx-auto mt-4 w-full max-w-sm space-y-2">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {t("continueWith")}
      </p>
      {providers.map((p) => (
        <form
          key={p}
          action={async () => {
            "use server";
            await signInWithProvider(p);
          }}
        >
          <Button type="submit" variant="secondary" className="w-full">
            {label[p]}
          </Button>
        </form>
      ))}
    </div>
  );
}
