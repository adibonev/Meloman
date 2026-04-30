import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Невалиден имейл адрес"),
  password: z.string().min(1, "Паролата е задължителна"),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "Името трябва да е поне 2 символа")
      .max(50, "Името не може да е повече от 50 символа"),
    email: z.string().email("Невалиден имейл адрес"),
    password: z.string().min(8, "Паролата трябва да е поне 8 символа"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролите не съвпадат",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
