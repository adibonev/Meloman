import { getTranslations } from "next-intl/server";

// 🔥 + day count with a "come back tomorrow" hint. Renders nothing
// when there's no streak yet (nothing to keep alive). Used in the
// nav (logged in) and on the profile header.
export async function StreakIndicator({ days }: { days: number }) {
  if (days < 1) return null;
  const t = await getTranslations("Streak");
  return (
    <span
      title={t("tooltip")}
      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-sm font-semibold text-primary"
    >
      <span aria-hidden>🔥</span>
      {t("days", { count: days })}
    </span>
  );
}
