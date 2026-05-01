import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware drop-in replacements for `next/link` and `next/navigation`.
// Use these everywhere we link or redirect, so paths get the correct
// locale prefix (BG = no prefix, EN = `/en` prefix).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
