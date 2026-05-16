import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["bg", "en"],
  defaultLocale: "bg",
  localePrefix: "as-needed",
  // Bulgarian-first product: never auto-redirect to /en based on the
  // browser's Accept-Language or a stale NEXT_LOCALE cookie. "/" always
  // serves BG; English is opt-in via an explicit /en URL.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
