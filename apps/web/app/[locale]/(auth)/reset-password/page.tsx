"use client";

import { Suspense, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/schemas/auth";
import { resetPasswordAction } from "./actions";
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
  | "passwordMin"
  | "passwordsMismatch"
  | "tokenRequired";

function ResetPasswordForm() {
  const t = useTranslations("ResetPassword");
  const tValidation = useTranslations("Validation");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverErrorKey, setServerErrorKey] = useState<
    "invalid" | "invalidToken" | null
  >(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  function onSubmit(data: ResetPasswordInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("token", data.token);
      formData.set("password", data.password);
      formData.set("confirmPassword", data.confirmPassword);
      const result = await resetPasswordAction(formData);
      if (result?.errorKey) {
        setServerErrorKey(result.errorKey);
        return;
      }
      setDone(true);
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
        {done ? (
          <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            {t("success")}
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("token")} />

            <div className="space-y-1.5">
              <Label htmlFor="password">{t("newPasswordLabel")}</Label>
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">
                {t("confirmPasswordLabel")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword?.message && (
                <p className="text-xs text-destructive">
                  {tValidation(
                    errors.confirmPassword.message as ValidationKey
                  )}
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

export default function ResetPasswordPage() {
  // useSearchParams must sit under a Suspense boundary (Next App Router).
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
