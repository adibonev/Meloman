"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  function onSubmit(data: RegisterInput) {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("displayName", data.displayName);
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("confirmPassword", data.confirmPassword);
      const result = await registerAction(formData);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <p className="font-heading text-3xl font-black tracking-widest text-foreground">
          MELOMAN
        </p>
        <CardTitle className="text-xl">Регистрация</CardTitle>
        <CardDescription>Създай нов акаунт</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Потребителско име</Label>
            <Input
              id="displayName"
              placeholder="Иван Иванов"
              {...register("displayName")}
            />
            {errors.displayName && (
              <p className="text-xs text-destructive">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Имейл</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Парола</Label>
            <Input
              id="password"
              type="password"
              placeholder="Минимум 8 символа"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Потвърди паролата</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Регистрация..." : "Регистрирай се"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Вече имаш акаунт?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Влез
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
