import { z } from "zod";

export const ROUND_TYPES = ["standard", "mystery_artist", "final"] as const;

export const createRoundSchema = z.object({
  title: z.string().min(2, "titleMin").max(200, "titleMax"),
  roundType: z.enum(ROUND_TYPES),
  introSlideText: z
    .string()
    .max(500, "descriptionMax")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateRoundInput = z.infer<typeof createRoundSchema>;
