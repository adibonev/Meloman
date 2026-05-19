"use client";

import { Suspense, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { loginAction } from "./actions";
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

type ValidationKey =
  | "emailInvalid"
  | "passwordRequired"
  | "passwordMin"
  | "displayNameMin"
  | "displayNameMax"
  | "passwordsMismatch";

function RegistrationSuccessMessage() {
  const t = useTranslations("Login");
  const searchParams = useSearchParams();
  if (searchParams.get("registered") !== "1") return null;
  return (
    <p className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
      {t("registeredSuccess")}
    </p>
  );
}

function VerifiedSuccessMessage() {
  const t = useTranslations("Login");
  const searchParams = useSearchParams();
  if (searchParams.get("verified") !== "1") return null;
  return (
    <p className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
      {t("verifiedSuccess")}
    </p>
  );
}

export default function LoginPage() {
  const t = useTranslations("Login");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    "credentials" | "generic" | "unverified" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      const result = await loginAction(formData);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <p className="font-heading text-3xl font-black tracking-widest text-foreground">
          MELOMAN
        </p>
        <CardTitle className="text-xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <Suspense fallback={null}>
          <RegistrationSuccessMessage />
          <VerifiedSuccessMessage />
        </Suspense>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
            />
            {errors.email?.message && (
              <p className="text-xs text-destructive">
                {tValidation(errors.email.message as ValidationKey)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password?.message && (
              <p className="text-xs text-destructive">
                {tValidation(errors.password.message as ValidationKey)}
              </p>
            )}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </div>

          {serverErrorKey && (
            <div className="space-y-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p>{t(`errors.${serverErrorKey}`)}</p>
              {serverErrorKey === "unverified" && (
                <Link
                  href="/verify-email"
                  className="inline-block font-medium text-foreground hover:underline"
                >
                  {t("resendVerification")}
                </Link>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-foreground hover:underline">
            {t("registerLink")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
