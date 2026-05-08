import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { questions, quizzes, rounds } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { EditRoundForm } from "./edit-form";
import { QuestionRowActions } from "./question-row-actions";

export default async function AdminRoundDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; roundId: string }>;
}) {
  const { locale, id, roundId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminEditRound");

  const [quiz] = await db
    .select({ id: quizzes.id, title: quizzes.title })
    .from(quizzes)
    .where(and(eq(quizzes.id, id), isNull(quizzes.deletedAt)))
    .limit(1);

  if (!quiz) notFound();

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.quizId, quiz.id)))
    .limit(1);

  if (!round) notFound();

  const roundQuestions = await db
    .select({
      id: questions.id,
      questionType: questions.questionType,
      questionText: questions.questionText,
      orderIndex: questions.orderIndex,
      pointsBase: questions.pointsBase,
      timeLimitSeconds: questions.timeLimitSeconds,
    })
    .from(questions)
    .where(eq(questions.roundId, round.id))
    .orderBy(asc(questions.orderIndex));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("forQuiz", { title: quiz.title })}
          </p>
        </div>
        <Link
          href={`/admin/quizzes/${quiz.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {t("backToQuiz")}
        </Link>
      </div>

      <EditRoundForm
        quizId={quiz.id}
        roundId={round.id}
        defaultValues={{
          title: round.title,
          roundType: round.roundType,
          introSlideText: round.introSlideText ?? "",
          advancementTopN: round.advancementTopN ?? 0,
        }}
      />

      <section className="space-y-4 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl uppercase tracking-wider">
            {t("questionsTitle")}
          </h2>
          <Link
            href={`/admin/quizzes/${quiz.id}/rounds/${round.id}/questions/new`}
            className={buttonVariants({ size: "sm" })}
          >
            {t("addQuestion")}
          </Link>
        </div>

        {roundQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("questionsEmpty")}</p>
        ) : (
          <ol className="space-y-2">
            {roundQuestions.map((question, idx) => (
              <li
                key={question.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3"
              >
                <span className="font-heading text-lg text-muted-foreground tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium">
                    {question.questionText}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`questionTypes.${question.questionType}`)} ·{" "}
                    {t("questionMeta", {
                      seconds: question.timeLimitSeconds,
                      points: question.pointsBase,
                    })}
                  </p>
                </div>
                <QuestionRowActions
                  quizId={quiz.id}
                  roundId={round.id}
                  questionId={question.id}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < roundQuestions.length - 1}
                />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
