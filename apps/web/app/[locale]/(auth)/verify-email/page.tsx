import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import {
  confirmEmail,
  sendVerificationFor,
} from "@/lib/auth/email-verification";
import { getRequestOrigin } from "@/lib/origin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("VerifyEmail");

  const token = typeof sp.token === "string" ? sp.token : null;
  const sent = sp.sent === "1";
  const hadError = sp.error === "1";

  // Token present → confirm immediately and report the outcome.
  let confirmState: "ok" | "invalid" | null = null;
  if (token) {
    const result = await confirmEmail(token);
    confirmState = "ok" in result ? "ok" : "invalid";
  }

  async function resend(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    // Silent for unknown / already-verified — no enumeration.
    await sendVerificationFor(email, await getRequestOrigin());
    redirect({ href: "/verify-email?sent=1", locale });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <p className="font-heading text-3xl font-black tracking-widest text-foreground">
          MELOMAN
        </p>
        <CardTitle className="text-xl">{t("title")}</CardTitle>
        <CardDescription>
          {confirmState === "ok"
            ? t("confirmedDescription")
            : t("description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {confirmState === "ok" && (
          <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            {t("confirmed")}
          </p>
        )}
        {(confirmState === "invalid" || hadError) && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t("invalid")}
          </p>
        )}
        {sent && (
          <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            {t("resent")}
          </p>
        )}

        {confirmState !== "ok" && (
          <form action={resend} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
              />
            </div>
            <Button type="submit" className="w-full">
              {t("resend")}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
