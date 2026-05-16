/**
 * Badge slug → Lucide icon name + rarity.
 *
 * Kept framework-agnostic (plain data, no React / lucide import) so
 * @meloman/shared stays dependency-free and a future mobile app can reuse
 * the same map with lucide-react-native. The web `BadgeIcon` component
 * (apps/web/components/badge.tsx) resolves the icon name to an actual
 * Lucide component.
 *
 * Every `icon` here was validated against the installed lucide-react
 * (1.14.0). Substitutions: 80s-kid uses `Radio` (no `Tape` icon),
 * bookworm uses `Library` (no `Books` icon).
 *
 * Rarities are a sensible default progression — adjust freely.
 */
export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export type BadgeIconSpec = {
  /** Lucide icon component name. */
  icon: string;
  rarity: BadgeRarity;
};

export const BADGE_ICONS: Record<string, BadgeIconSpec> = {
  // STREAK
  "meloman-novice": { icon: "Flame", rarity: "common" },
  "meloman-apprentice": { icon: "Flame", rarity: "common" },
  consistent: { icon: "Flame", rarity: "rare" },
  "vinyl-veteran": { icon: "Medal", rarity: "rare" },
  lifer: { icon: "Trophy", rarity: "epic" },
  legend: { icon: "Crown", rarity: "legendary" },
  "cold-save": { icon: "Snowflake", rarity: "common" },

  // DAILY
  "morning-bird": { icon: "Sunrise", rarity: "common" },
  "night-owl": { icon: "Moon", rarity: "common" },
  listener: { icon: "Headphones", rarity: "common" },
  meloman: { icon: "Music", rarity: "rare" },
  "first-guess": { icon: "Lightbulb", rarity: "common" },
  "quick-mind": { icon: "Zap", rarity: "rare" },
  "perfect-week": { icon: "Sparkles", rarity: "epic" },

  // LIVE_QUIZ
  "first-concert": { icon: "Ticket", rarity: "common" },
  regular: { icon: "Users", rarity: "common" },
  bronze: { icon: "Award", rarity: "rare" },
  silver: { icon: "Award", rarity: "rare" },
  champion: { icon: "Trophy", rarity: "legendary" },
  "snap-submit": { icon: "Zap", rarity: "rare" },
  captain: { icon: "Star", rarity: "rare" },
  "vidin-champion": { icon: "MapPin", rarity: "epic" },
  tour: { icon: "Globe", rarity: "epic" },
  "perfect-game": { icon: "Target", rarity: "legendary" },

  // GENRES
  "rock-encyclopedia": { icon: "Guitar", rarity: "rare" },
  "pop-star": { icon: "Mic", rarity: "rare" },
  classic: { icon: "Piano", rarity: "rare" },
  "metal-head": { icon: "Skull", rarity: "rare" },
  "jazz-cat": { icon: "Music2", rarity: "rare" },
  bulgarian: { icon: "Flag", rarity: "rare" },
  globetrotter: { icon: "Globe", rarity: "epic" },
  "retro-soul": { icon: "Disc3", rarity: "rare" },
  "80s-kid": { icon: "Radio", rarity: "rare" },
  "90s-nostalgia": { icon: "Disc", rarity: "rare" },

  // READER
  curious: { icon: "BookOpen", rarity: "common" },
  bookworm: { icon: "Library", rarity: "rare" },
  scholar: { icon: "GraduationCap", rarity: "epic" },
  explorer: { icon: "Search", rarity: "rare" },
  "deep-read": { icon: "Clock", rarity: "rare" },

  // SPECIAL
  "first-steps": { icon: "Egg", rarity: "common" },
  "welcome-pack": { icon: "Gift", rarity: "common" },
  lucky: { icon: "Sparkle", rarity: "rare" },
  sniper: { icon: "Target", rarity: "epic" },
  "champion-week": { icon: "Star", rarity: "epic" },
  founders: { icon: "Landmark", rarity: "legendary" },
  birthday: { icon: "Cake", rarity: "rare" },
  "bulgarian-pro": { icon: "Heart", rarity: "epic" },

  // SOCIAL
  social: { icon: "UserPlus", rarity: "common" },
  promoter: { icon: "Users2", rarity: "rare" },
  share: { icon: "Share2", rarity: "common" },
  "team-player": { icon: "MessagesSquare", rarity: "rare" },

  // TOTAL
  "xp-1k": { icon: "Star", rarity: "common" },
  "xp-5k": { icon: "Stars", rarity: "rare" },
  "xp-10k": { icon: "Stars", rarity: "epic" },
  "semi-collector": { icon: "Award", rarity: "rare" },
  collector: { icon: "Medal", rarity: "epic" },
  immortal: { icon: "Crown", rarity: "legendary" },
};

export const DEFAULT_BADGE_ICON: BadgeIconSpec = {
  icon: "Award",
  rarity: "common",
};
