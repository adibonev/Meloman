"use client";

import { Suspense, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function RegistrationSuccessMessage() {
  const searchParams = useSearchParams();
  if (searchParams.get("registered") !== "1") return null;
  return (
    <p className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
      Регистрацията е успешна! Влез с новия си акаунт.
    </p>
  );
}

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      const result = await loginAction(formData);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <p className="font-heading text-3xl font-black tracking-widest text-foreground">
          MELOMAN
        </p>
        <CardTitle className="text-xl">Вход</CardTitle>
        <CardDescription>Влез в акаунта си</CardDescription>
      </CardHeader>

      <CardContent>
        <Suspense fallback={null}>
          <RegistrationSuccessMessage />
        </Suspense>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Влизане..." : "Влез"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Нямаш акаунт?{" "}
          <Link href="/register" className="text-foreground hover:underline">
            Регистрирай се
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
