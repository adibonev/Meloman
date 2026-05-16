import type { ComponentType } from "react";
import {
  Award,
  BookOpen,
  Cake,
  Clock,
  Crown,
  Disc,
  Disc3,
  Egg,
  Flag,
  Flame,
  Gift,
  Globe,
  GraduationCap,
  Guitar,
  Headphones,
  Heart,
  Library,
  Lightbulb,
  Lock,
  MapPin,
  Medal,
  MessagesSquare,
  Mic,
  Moon,
  Music,
  Music2,
  Piano,
  Radio,
  Search,
  Share2,
  Skull,
  Snowflake,
  Sparkle,
  Sparkles,
  Star,
  Stars,
  Sunrise,
  Target,
  Ticket,
  UserPlus,
  Users,
  Users2,
  Zap,
} from "lucide-react";
import {
  BADGE_ICONS,
  DEFAULT_BADGE_ICON,
  type BadgeRarity,
} from "@meloman/shared/badges-icons";
import { cn } from "@/lib/utils";

type IconProps = { size?: number; color?: string; strokeWidth?: number };

// Only the icons referenced by BADGE_ICONS — keeps the bundle tree-shaken.
const ICONS: Record<string, ComponentType<IconProps>> = {
  Award,
  BookOpen,
  Cake,
  Clock,
  Crown,
  Disc,
  Disc3,
  Egg,
  Flag,
  Flame,
  Gift,
  Globe,
  GraduationCap,
  Guitar,
  Headphones,
  Heart,
  Library,
  Lightbulb,
  MapPin,
  Medal,
  MessagesSquare,
  Mic,
  Moon,
  Music,
  Music2,
  Piano,
  Radio,
  Search,
  Share2,
  Skull,
  Snowflake,
  Sparkle,
  Sparkles,
  Star,
  Stars,
  Sunrise,
  Target,
  Ticket,
  UserPlus,
  Users,
  Users2,
  Zap,
};

const RARITY_COLOR: Record<BadgeRarity, string> = {
  common: "#B5A88F", // fg-secondary
  rare: "#60A5FA",
  epic: "#A855F7",
  legendary: "#FFD166", // accent
};

/**
 * Circular badge icon. Unlocked → rarity-colored Lucide icon on the
 * elevated surface. Locked → desaturated + dimmed with a lock overlay
 * (the badge is teased, not hidden). Tooltip shows the description.
 */
export function BadgeIcon({
  slug,
  rarity,
  unlocked,
  size = "lg",
  description,
}: {
  slug: string;
  rarity: BadgeRarity;
  unlocked: boolean;
  size?: "sm" | "lg";
  description?: string;
}) {
  const iconName = BADGE_ICONS[slug] ?? DEFAULT_BADGE_ICON;
  const Icon = ICONS[iconName] ?? Award;
  const isLg = size === "lg";
  const color = unlocked ? RARITY_COLOR[rarity] : RARITY_COLOR.common;

  return (
    <div
      className="relative inline-flex"
      title={description}
      aria-label={description}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted transition-transform hover:scale-105",
          isLg ? "h-20 w-20" : "h-8 w-8",
          !unlocked && "opacity-30 grayscale",
        )}
      >
        <Icon
          size={isLg ? 40 : 16}
          color={color}
          strokeWidth={1.75}
        />
      </div>
      {!unlocked && (
        <span
          className={cn(
            "absolute -right-1 -bottom-1 flex items-center justify-center rounded-full bg-background ring-1 ring-border",
            isLg ? "h-6 w-6" : "h-4 w-4",
          )}
        >
          <Lock size={isLg ? 13 : 9} className="text-muted-foreground" />
        </span>
      )}
    </div>
  );
}
