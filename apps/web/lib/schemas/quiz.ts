import { z } from "zod";

export const QUIZ_THEMES = ["modern", "vintage", "neon"] as const;
export const QUIZ_LANGUAGES = ["bg", "en"] as const;

export const createQuizSchema = z.object({
  title: z.string().min(2, "titleMin").max(200, "titleMax"),
  description: z
    .string()
    .max(500, "descriptionMax")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  theme: z.enum(QUIZ_THEMES),
  language: z.enum(QUIZ_LANGUAGES),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
