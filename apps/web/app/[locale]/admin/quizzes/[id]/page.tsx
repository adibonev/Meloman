import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { quizzes, rounds } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { EditQuizForm } from "./edit-form";
import { MoveRoundButtons } from "./move-round-buttons";

export default async function AdminQuizDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminQuizDetail");

  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, id), isNull(quizzes.deletedAt)))
    .limit(1);

  if (!quiz) notFound();

  const quizRounds = await db
    .select({
      id: rounds.id,
      title: rounds.title,
      roundType: rounds.roundType,
      orderIndex: rounds.orderIndex,
      introSlideText: rounds.introSlideText,
    })
    .from(rounds)
    .where(eq(rounds.quizId, quiz.id))
    .orderBy(asc(rounds.orderIndex));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
          {t("title")}
        </h1>
        <Link
          href="/admin/quizzes"
          className="text-sm text-muted-foreground hover:underline"
        >
          {t("backToList")}
        </Link>
      </div>

      <EditQuizForm
        quizId={quiz.id}
        defaultValues={{
          title: quiz.title,
          description: quiz.description ?? "",
          theme: quiz.theme,
          language: quiz.language,
          status: quiz.status,
        }}
      />

      <section className="space-y-4 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl uppercase tracking-wider">
            {t("roundsTitle")}
          </h2>
          <Link
            href={`/admin/quizzes/${quiz.id}/rounds/new`}
            className={buttonVariants({ size: "sm" })}
          >
            {t("addRound")}
          </Link>
        </div>

        {quizRounds.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("roundsEmpty")}</p>
        ) : (
          <ol className="space-y-2">
            {quizRounds.map((round, idx) => (
              <li
                key={round.id}
                className="flex items-stretch gap-2 rounded-md border border-border bg-card transition-colors hover:border-foreground/30"
              >
                <Link
                  href={`/admin/quizzes/${quiz.id}/rounds/${round.id}`}
                  className="flex-1 rounded-l-md px-4 py-3 hover:bg-muted/50"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-heading text-lg text-muted-foreground tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{round.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(`roundTypes.${round.roundType}`)}
                      </p>
                    </div>
                  </div>
                  {round.introSlideText && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {round.introSlideText}
                    </p>
                  )}
                </Link>
                <div className="flex items-center pr-2">
                  <MoveRoundButtons
                    quizId={quiz.id}
                    roundId={round.id}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < quizRounds.length - 1}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
