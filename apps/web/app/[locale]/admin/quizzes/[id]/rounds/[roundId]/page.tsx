import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { quizzes, rounds } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { EditRoundForm } from "./edit-form";

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
        }}
      />
    </div>
  );
}
