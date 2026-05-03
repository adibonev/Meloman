import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { quizzes, rounds } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { MultipleChoiceForm } from "./multiple-choice-form";

export default async function NewMultipleChoiceQuestionPage({
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
            {t("titleMultipleChoice")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("forRound", {
              quiz: parent.quizTitle,
              round: parent.roundTitle,
            })}
          </p>
        </div>
        <Link
          href={`/admin/quizzes/${parent.quizId}/rounds/${parent.roundId}/questions/new`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {t("backToChooser")}
        </Link>
      </div>

      <MultipleChoiceForm quizId={parent.quizId} roundId={parent.roundId} />
    </div>
  );
}
