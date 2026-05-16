"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/schemas/auth";
import { forgotPasswordAction } from "./actions";
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

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");
  const tValidation = useTranslations("Validation");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  function onSubmit(data: ForgotPasswordInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      await forgotPasswordAction(formData);
      // Always show the same confirmation (anti-enumeration).
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
                  {tValidation(errors.email.message as "emailInvalid")}
                </p>
              )}
            </div>

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
