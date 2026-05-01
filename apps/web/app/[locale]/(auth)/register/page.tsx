"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { registerAction } from "./actions";
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

export default function RegisterPage() {
  const t = useTranslations("Register");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    "invalidData" | "emailTaken" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  function onSubmit(data: RegisterInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("displayName", data.displayName);
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("confirmPassword", data.confirmPassword);
      const result = await registerAction(formData);
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">{t("displayNameLabel")}</Label>
            <Input
              id="displayName"
              placeholder={t("displayNamePlaceholder")}
              {...register("displayName")}
            />
            {errors.displayName?.message && (
              <p className="text-xs text-destructive">
                {tValidation(errors.displayName.message as ValidationKey)}
              </p>
            )}
          </div>

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
              placeholder={t("passwordPlaceholder")}
              {...register("password")}
            />
            {errors.password?.message && (
              <p className="text-xs text-destructive">
                {tValidation(errors.password.message as ValidationKey)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword?.message && (
              <p className="text-xs text-destructive">
                {tValidation(errors.confirmPassword.message as ValidationKey)}
              </p>
            )}
          </div>

          {serverErrorKey && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t(`errors.${serverErrorKey}`)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href="/login" className="text-foreground hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
