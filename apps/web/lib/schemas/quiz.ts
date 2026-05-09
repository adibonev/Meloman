import { z } from "zod";

export const QUIZ_THEMES = ["modern", "vintage", "neon"] as const;
export const QUIZ_LANGUAGES = ["bg", "en"] as const;
export const QUIZ_STATUSES = ["draft", "published", "archived"] as const;

// Max members per team. 0 means "no limit" (use null in DB, default).
// 1-32 is a sensible UX range for live trivia nights — venue tables
// rarely seat more than 6-8, and the cap is mostly a guardrail against
// one team coordinating from multiple devices.
export const MAX_TEAM_SIZE_MIN = 0;
export const MAX_TEAM_SIZE_MAX = 32;

const quizBaseFields = {
  title: z.string().min(2, "titleMin").max(200, "titleMax"),
  description: z
    .string()
    .max(500, "descriptionMax")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  theme: z.enum(QUIZ_THEMES),
  language: z.enum(QUIZ_LANGUAGES),
};

export const createQuizSchema = z.object(quizBaseFields);

// Per-round cutoffs (rounds.advancement_top_n) replaced the quiz-level
// finalRoundTopN. The DB column is still there for back-compat but no
// schema or form references it.
export const updateQuizSchema = z.object({
  ...quizBaseFields,
  status: z.enum(QUIZ_STATUSES),
  maxTeamSize: z.coerce
    .number()
    .int()
    .min(MAX_TEAM_SIZE_MIN, "maxTeamSizeMin")
    .max(MAX_TEAM_SIZE_MAX, "maxTeamSizeMax"),
  sponsorIds: z.array(z.string().uuid("sponsorIdInvalid")).optional(),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
