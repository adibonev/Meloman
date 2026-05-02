import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { quizzes } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { EditQuizForm } from "./edit-form";

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

      <section className="space-y-3 border-t border-border pt-8">
        <h2 className="font-heading text-xl uppercase tracking-wider">
          {t("roundsTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("roundsEmpty")}</p>
      </section>
    </div>
  );
}
