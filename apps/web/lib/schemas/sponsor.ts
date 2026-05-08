import { z } from "zod";

// Minimal sponsor schema for the MVP: just a name + logo URL.
// Contract dates / contact email exist in the DB but aren't worth a
// form yet — admins can add them later via DB if needed.
export const createSponsorSchema = z.object({
  name: z.string().min(2, "sponsorNameMin").max(200, "sponsorNameMax"),
  logoUrl: z
    .string()
    .url("sponsorLogoUrlInvalid")
    .max(2048, "sponsorLogoUrlMax")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;
