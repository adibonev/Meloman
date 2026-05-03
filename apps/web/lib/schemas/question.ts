import { z } from "zod";

export const QUESTION_TYPES = [
  "multiple_choice",
  "open_text",
  "audio",
  "image_reveal",
  "lyric_blank",
  "decade",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const MULTIPLE_CHOICE_OPTION_COUNT = 4;
export const MULTIPLE_CHOICE_CORRECT_INDEXES = [0, 1, 2, 3] as const;

const optionSchema = z
  .string()
  .min(1, "optionMin")
  .max(200, "optionMax");

export const createMultipleChoiceQuestionSchema = z.object({
  questionText: z.string().min(5, "questionTextMin").max(500, "questionTextMax"),
  options: z.tuple([optionSchema, optionSchema, optionSchema, optionSchema]),
  correctIndex: z.coerce
    .number()
    .int()
    .min(0, "correctIndexRange")
    .max(3, "correctIndexRange"),
  timeLimitSeconds: z.coerce
    .number()
    .int()
    .min(5, "timeLimitMin")
    .max(120, "timeLimitMax"),
  pointsBase: z.coerce
    .number()
    .int()
    .min(1, "pointsMin")
    .max(10, "pointsMax"),
});

export type CreateMultipleChoiceQuestionInput = z.infer<
  typeof createMultipleChoiceQuestionSchema
>;

// Open-text answers are matched server-side via Levenshtein <= 2 against any
// entry in `acceptableAnswers`. The first entry doubles as the canonical
// answer shown on the host's reveal screen.
export const createOpenTextQuestionSchema = z.object({
  questionText: z.string().min(5, "questionTextMin").max(500, "questionTextMax"),
  acceptableAnswers: z
    .array(z.string().min(1, "answerMin").max(200, "answerMax"))
    .min(1, "answersMin")
    .max(20, "answersMax"),
  timeLimitSeconds: z.coerce
    .number()
    .int()
    .min(5, "timeLimitMin")
    .max(120, "timeLimitMax"),
  pointsBase: z.coerce
    .number()
    .int()
    .min(1, "pointsMin")
    .max(10, "pointsMax"),
});

export type CreateOpenTextQuestionInput = z.infer<
  typeof createOpenTextQuestionSchema
>;
