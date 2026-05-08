import { z } from "zod";

export const ROUND_TYPES = ["standard", "mystery_artist", "final"] as const;

// Per-round cutoff applied AFTER the round ends. 0 means "no cutoff" —
// every currently-active team continues into the next round. The final
// round usually leaves this at 0 since there's no round after it.
export const ADVANCEMENT_TOP_N_MIN = 0;
export const ADVANCEMENT_TOP_N_MAX = 32;

export const createRoundSchema = z.object({
  title: z.string().min(2, "titleMin").max(200, "titleMax"),
  roundType: z.enum(ROUND_TYPES),
  introSlideText: z
    .string()
    .max(500, "descriptionMax")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  advancementTopN: z.coerce
    .number()
    .int()
    .min(ADVANCEMENT_TOP_N_MIN, "advancementTopNMin")
    .max(ADVANCEMENT_TOP_N_MAX, "advancementTopNMax"),
});

export type CreateRoundInput = z.infer<typeof createRoundSchema>;
