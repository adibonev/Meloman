import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { quizzes } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { NewRoundForm } from "./new-round-form";

export default async function NewRoundPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminNewRound");

  const [quiz] = await db
    .select({ id: quizzes.id, title: quizzes.title })
    .from(quizzes)
    .where(and(eq(quizzes.id, id), isNull(quizzes.deletedAt)))
    .limit(1);

  if (!quiz) notFound();

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

      <NewRoundForm quizId={quiz.id} />
    </div>
  );
}
