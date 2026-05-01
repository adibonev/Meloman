import { z } from "zod";

// Validation messages return translation KEYS (resolved via the
// `Validation.*` namespace in messages/{locale}.json), not literal text.
export const loginSchema = z.object({
  email: z.string().email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "displayNameMin")
      .max(50, "displayNameMax"),
    email: z.string().email("emailInvalid"),
    password: z.string().min(8, "passwordMin"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMismatch",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
