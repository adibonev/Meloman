/**
 * Badge slug → Lucide icon name.
 *
 * Framework-agnostic (plain data, no React / lucide import) so
 * @meloman/shared stays dependency-free and a future mobile app can reuse
 * the same map with lucide-react-native. The web `BadgeIcon` component
 * (apps/web/components/badge.tsx) resolves the name to a component.
 *
 * Slugs mirror the catalog of record (packages/db/seed-badges.ts).
 * Rarity / names / descriptions live in that catalog + the DB — not here,
 * to keep a single source of truth. Names validated against lucide-react
 * 1.14.0; substitutions: 80s-kid → Radio (no Tape), bookworm → Library
 * (no Books).
 */
export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export const BADGE_ICONS: Record<string, string> = {
  // STREAK
  "meloman-novice": "Flame",
  "meloman-apprentice": "Flame",
  consistent: "Flame",
  "vinyl-veteran": "Medal",
  lifer: "Trophy",
  legend: "Crown",
  "cold-save": "Snowflake",

  // DAILY
  "morning-bird": "Sunrise",
  "night-owl": "Moon",
  listener: "Headphones",
  "meloman-master": "Music",
  "first-guess": "Lightbulb",
  "quick-mind": "Zap",
  "perfect-week": "Sparkles",

  // LIVE QUIZ
  "first-concert": "Ticket",
  regular: "Users",
  bronze: "Award",
  silver: "Award",
  champion: "Trophy",
  "snap-submit": "Zap",
  captain: "Star",
  "vidin-champion": "MapPin",
  tour: "Globe",
  "perfect-game": "Target",

  // GENRES
  "rock-encyclopedia": "Guitar",
  "pop-star": "Mic",
  classic: "Piano",
  "metal-head": "Skull",
  "jazz-cat": "Music2",
  bulgarian: "Flag",
  globetrotter: "Globe",
  "retro-soul": "Disc3",
  "80s-kid": "Radio",
  "90s-nostalgia": "Disc",

  // READER
  curious: "BookOpen",
  bookworm: "Library",
  scholar: "GraduationCap",
  explorer: "Search",
  "deep-read": "Clock",

  // SPECIAL
  "first-steps": "Egg",
  "welcome-pack": "Gift",
  lucky: "Sparkle",
  sniper: "Target",
  "champion-week": "Star",
  founders: "Landmark",
  birthday: "Cake",
  "bulgarian-pro": "Heart",

  // SOCIAL
  social: "UserPlus",
  promoter: "Users2",
  share: "Share2",
  "team-player": "MessagesSquare",

  // TOTAL XP
  "xp-1k": "Star",
  "xp-5k": "Stars",
  "xp-10k": "Stars",
  "semi-collector": "Award",
  collector: "Medal",
  immortal: "Crown",
};

export const DEFAULT_BADGE_ICON = "Award";
