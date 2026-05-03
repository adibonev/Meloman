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

// Audio limits. Adi raised the live-quiz cap from CLAUDE.md §4.6 (15 sec) to
// 30 sec on 2026-05-03. Size cap is generous to leave headroom for short
// future clips (~30 sec MP3 ≈ 1 MB; the 6 MB cap matches our Server Action
// body-size limit and gives buffer for variable bitrates).
export const AUDIO_MAX_DURATION_SECONDS = 30;
export const AUDIO_MAX_SIZE_BYTES = 6 * 1024 * 1024;
export const AUDIO_ACCEPTED_MIME_TYPES = ["audio/mpeg", "audio/mp3"] as const;

// Form-side payload (the audio file is validated separately in the action,
// since a Zod schema can't introspect a File's MIME / size cheaply on the
// client).
export const createAudioQuestionMetadataSchema = z.object({
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

export type CreateAudioQuestionMetadataInput = z.infer<
  typeof createAudioQuestionMetadataSchema
>;

// Image source values track copyright provenance per CLAUDE.md §4.7. The
// public display caption uses these labels; admins can pick "Other" for any
// non-standard source.
export const IMAGE_SOURCES = [
  "Wikipedia",
  "PressKit",
  "AlbumCover",
  "Other",
] as const;
export type ImageSource = (typeof IMAGE_SOURCES)[number];
export const IMAGE_SOURCES_REQUIRING_ATTRIBUTION: readonly ImageSource[] = [
  "Wikipedia",
  "PressKit",
];

export const IMAGE_MAX_SIZE_BYTES = 6 * 1024 * 1024;
export const IMAGE_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const createImageRevealQuestionMetadataSchema = z
  .object({
    questionText: z
      .string()
      .min(5, "questionTextMin")
      .max(500, "questionTextMax"),
    acceptableAnswers: z
      .array(z.string().min(1, "answerMin").max(200, "answerMax"))
      .min(1, "answersMin")
      .max(20, "answersMax"),
    imageSource: z.enum(IMAGE_SOURCES),
    imageAttribution: z
      .string()
      .max(500, "attributionMax")
      .optional()
      .or(z.literal("").transform(() => undefined)),
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
  })
  .refine(
    (data) =>
      !IMAGE_SOURCES_REQUIRING_ATTRIBUTION.includes(data.imageSource) ||
      (data.imageAttribution !== undefined &&
        data.imageAttribution.length > 0),
    {
      message: "attributionRequired",
      path: ["imageAttribution"],
    }
  );

export type CreateImageRevealQuestionMetadataInput = z.infer<
  typeof createImageRevealQuestionMetadataSchema
>;

// Lyric Fill-in-the-blank: admin types lyrics with `___` placeholders and
// fills the missing words below. Scoring is per-word (1 point per correct
// blank, case-insensitive) — see CLAUDE.md §3.1 Type 5.
export const LYRIC_BLANK_PLACEHOLDER = "___";
export const LYRIC_BLANK_MIN_BLANKS = 1;
export const LYRIC_BLANK_MAX_BLANKS = 10;

// Counts non-overlapping occurrences of "___" in the lyric text.
export function countLyricBlanks(text: string): number {
  return (text.match(/___/g) ?? []).length;
}

export const createLyricBlankQuestionSchema = z
  .object({
    lyricText: z.string().min(10, "lyricMin").max(1000, "lyricMax"),
    answers: z
      .array(z.string().min(1, "answerMin").max(100, "answerMax"))
      .min(LYRIC_BLANK_MIN_BLANKS, "answersMinBlank")
      .max(LYRIC_BLANK_MAX_BLANKS, "answersMaxBlank"),
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
  })
  .refine(
    (data) => countLyricBlanks(data.lyricText) === data.answers.length,
    {
      message: "blanksCountMismatch",
      path: ["answers"],
    }
  );

export type CreateLyricBlankQuestionInput = z.infer<
  typeof createLyricBlankQuestionSchema
>;

// Decade / Year question. Admin enters the exact year; the decade is derived
// from it. Player guesses both at runtime — partial credit per CLAUDE.md
// §3.1 Type 6: decade = 1 × pointsBase, exact year = 2 × pointsBase
// (max 3 × pointsBase, since correct year implies correct decade).
export const DECADE_MIN_YEAR = 1900;
export const DECADE_MAX_YEAR = 2030;

export function decadeFromYear(year: number): number {
  return Math.floor(year / 10) * 10;
}

export const createDecadeQuestionSchema = z.object({
  questionText: z.string().min(5, "questionTextMin").max(500, "questionTextMax"),
  correctYear: z.coerce
    .number()
    .int()
    .min(DECADE_MIN_YEAR, "yearMin")
    .max(DECADE_MAX_YEAR, "yearMax"),
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

export type CreateDecadeQuestionInput = z.infer<
  typeof createDecadeQuestionSchema
>;
