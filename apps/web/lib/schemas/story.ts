import { z } from "zod";

// Slug: lowercase letters, digits, hyphens (URL-safe). Generated from the
// title in the admin editor but validated here so REST callers can't store
// a slug that breaks routing.
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const storyBaseFields = {
  title: z.string().min(3, "titleMin").max(200, "titleMax"),
  subtitle: z
    .string()
    .max(300, "subtitleMax")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  // TipTap HTML output. Length cap is generous; the editor enforces UX.
  body: z.string().min(10, "bodyMin").max(50000, "bodyMax"),
  coverImageUrl: z.string().url("urlInvalid").optional().or(z.literal("")),
  heroImageUrl: z.string().url("urlInvalid").optional().or(z.literal("")),
  artistName: z
    .string()
    .max(200, "artistMax")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  youtubeUrl: z.string().url("urlInvalid").optional().or(z.literal("")),
  spotifyUri: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
};

// Slug is optional: when omitted/blank the action derives it from the
// title via slugify(). If provided it must be URL-safe.
export const createStorySchema = z.object({
  ...storyBaseFields,
  slug: z
    .string()
    .regex(slugRegex, "slugInvalid")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

// Update allows toggling publish state. `published` true sets published_at
// to now; false clears it back to draft.
export const updateStorySchema = z.object({
  ...storyBaseFields,
  published: z.boolean(),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;

/** Rough reading time: ~200 words/min, min 1 minute. */
export function estimateReadingMinutes(htmlBody: string): number {
  const text = htmlBody.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Bulgarian Cyrillic → Latin (official transliteration, simplified). Used
// to auto-generate a URL-safe slug from the title so the admin never has
// to hand-type one (the #1 cause of silent save failures).
const CYR_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
  ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  const lower = input.trim().toLowerCase();
  let out = "";
  for (const ch of lower) {
    out += CYR_MAP[ch] ?? ch;
  }
  return out
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
