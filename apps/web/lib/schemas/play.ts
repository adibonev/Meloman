import { z } from "zod";

export const joinAsAnonymousSchema = z.object({
  // Player display name shown on the leaderboard. Loose bounds — the BG side
  // expects mostly Cyrillic short names ("Иван", "Мими"), but we allow a bit
  // of Latin and emoji play.
  displayName: z
    .string()
    .min(2, "displayNameMin")
    .max(50, "displayNameMax"),
});

export type JoinAsAnonymousInput = z.infer<typeof joinAsAnonymousSchema>;

// 64-char hex / uuid fingerprint produced by lib/device.ts. We accept up to
// 128 chars to leave room for a real fingerprint library swap later.
const deviceFingerprintField = z
  .string()
  .min(8, "deviceFingerprintInvalid")
  .max(128, "deviceFingerprintInvalid");

const teamNameField = z
  .string()
  .min(2, "teamNameMin")
  .max(40, "teamNameMax");

// Form-side schema for the player's "create team" form. Only the team name
// is bound to a visible input; the device fingerprint is read from
// localStorage at submit time and added to the FormData before the server
// action is called. Keeping it out of the form schema avoids a hidden
// validation failure when RHF runs on first paint (fingerprint is "" until
// useEffect swaps it in).
export const createTeamFormSchema = z.object({
  name: teamNameField,
});

export const createTeamSchema = z.object({
  name: teamNameField,
  deviceFingerprint: deviceFingerprintField,
});

export const joinTeamSchema = z.object({
  teamId: z.string().uuid("teamIdInvalid"),
  deviceFingerprint: deviceFingerprintField,
});

// Captain hands the role to another teammate (lobby only). No device
// fingerprint — this is an authenticated team member acting, not a join.
export const transferCaptainSchema = z.object({
  teamId: z.string().uuid("teamIdInvalid"),
  targetUserId: z.string().uuid("targetUserIdInvalid"),
});

export type TransferCaptainInput = z.infer<typeof transferCaptainSchema>;

const textAnswerField = z
  .string()
  .trim()
  .min(1, "answerMin")
  .max(200, "answerMax");

export const submitAnswerSchema = z
  .discriminatedUnion("questionType", [
    z.object({
      questionType: z.literal("multiple_choice"),
      optionIndex: z.coerce
        .number()
        .int()
        .min(0, "optionIndexInvalid")
        .max(3, "optionIndexInvalid"),
    }),
    z.object({
      questionType: z.literal("open_text"),
      textAnswer: textAnswerField,
    }),
    z.object({
      questionType: z.literal("audio"),
      textAnswer: textAnswerField,
    }),
    z.object({
      questionType: z.literal("image_reveal"),
      textAnswer: textAnswerField,
    }),
    z.object({
      questionType: z.literal("lyric_blank"),
      lyricAnswers: z
        .array(textAnswerField)
        .min(1, "answersMinBlank")
        .max(10, "answersMaxBlank"),
    }),
    z.object({
      questionType: z.literal("decade"),
      decade: z.coerce
        .number()
        .int()
        .min(1900, "yearMin")
        .max(2030, "yearMax"),
      year: z.coerce.number().int().min(1900, "yearMin").max(2030, "yearMax"),
    }),
  ])
  .superRefine((data, ctx) => {
    // Player picked decade D, so the year must fall inside [D, D+9]. Without
    // this, a captain could pick 1970 + 1985 and the grading logic would
    // award a "correct decade" point even though the player's intent was
    // self-contradictory. Applied as superRefine on the parent because
    // Zod's discriminatedUnion does not accept ZodEffects branches.
    if (data.questionType !== "decade") return;
    if (data.year < data.decade || data.year > data.decade + 9) {
      ctx.addIssue({
        path: ["year"],
        code: z.ZodIssueCode.custom,
        message: "yearOutsideDecade",
      });
    }
  });

export type CreateTeamFormInput = z.infer<typeof createTeamFormSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

// A small palette of distinguishable hex colours for teams; the action picks
// the first colour that isn't already used in the session.
export const TEAM_COLORS = [
  "#ef4444", // red-500
  "#3b82f6", // blue-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#a855f7", // purple-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
] as const;

// Emojis are food/sound themed — friendly, recognisable on a TV screen.
export const TEAM_EMOJIS = [
  "🎸",
  "🥁",
  "🎷",
  "🎺",
  "🎹",
  "🎻",
  "🎤",
  "🎧",
] as const;
