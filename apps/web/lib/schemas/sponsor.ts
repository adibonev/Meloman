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

// Logo upload limits (smaller than the question image cap because
// sponsor logos are typically <500KB optimised; 2MB is generous).
export const SPONSOR_LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const SPONSOR_LOGO_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
] as const;
