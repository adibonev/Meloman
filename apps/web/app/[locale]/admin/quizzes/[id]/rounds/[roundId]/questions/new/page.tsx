import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { quizzes, rounds } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { QUESTION_TYPES, type QuestionType } from "@/lib/schemas/question";

const IMPLEMENTED_TYPES: QuestionType[] = ["multiple_choice", "open_text"];

const SLUG_BY_TYPE: Record<QuestionType, string> = {
  multiple_choice: "multiple-choice",
  open_text: "open-text",
  audio: "audio",
  image_reveal: "image-reveal",
  lyric_blank: "lyric-blank",
  decade: "decade",
};

export default async function ChooseQuestionTypePage({
  params,
}: {
  params: Promise<{ locale: string; id: string; roundId: string }>;
}) {
  const { locale, id, roundId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminNewQuestion");

  const [parent] = await db
    .select({
      quizId: quizzes.id,
      quizTitle: quizzes.title,
      roundId: rounds.id,
      roundTitle: rounds.title,
    })
    .from(rounds)
    .innerJoin(quizzes, eq(quizzes.id, rounds.quizId))
    .where(
      and(
        eq(rounds.id, roundId),
        eq(rounds.quizId, id),
        isNull(quizzes.deletedAt)
      )
    )
    .limit(1);

  if (!parent) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
            {t("chooserTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("forRound", {
              quiz: parent.quizTitle,
              round: parent.roundTitle,
            })}
          </p>
        </div>
        <Link
          href={`/admin/quizzes/${parent.quizId}/rounds/${parent.roundId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {t("backToRound")}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {QUESTION_TYPES.map((type) => {
          const enabled = IMPLEMENTED_TYPES.includes(type);
          const baseClasses =
            "flex flex-col gap-1 rounded-md border border-border bg-card px-4 py-4 text-left";
          const enabledClasses =
            "transition-colors hover:border-foreground/30 hover:bg-muted/50";
          const disabledClasses = "cursor-not-allowed opacity-50";

          const inner = (
            <>
              <span className="font-heading uppercase tracking-wider">
                {t(`types.${type}.name`)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(`types.${type}.description`)}
              </span>
              {!enabled && (
                <span className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("comingSoon")}
                </span>
              )}
            </>
          );

          if (!enabled) {
            return (
              <div
                key={type}
                aria-disabled="true"
                className={`${baseClasses} ${disabledClasses}`}
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={type}
              href={`/admin/quizzes/${parent.quizId}/rounds/${parent.roundId}/questions/new/${SLUG_BY_TYPE[type]}`}
              className={`${baseClasses} ${enabledClasses}`}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
