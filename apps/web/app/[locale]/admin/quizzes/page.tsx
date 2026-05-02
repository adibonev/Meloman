import { desc, isNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { quizzes } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminQuizzesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminQuizzes");

  const rows = await db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      status: quizzes.status,
      theme: quizzes.theme,
      createdAt: quizzes.createdAt,
    })
    .from(quizzes)
    .where(isNull(quizzes.deletedAt))
    .orderBy(desc(quizzes.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
          {t("title")}
        </h1>
        <Link
          href="/admin/quizzes/new"
          className={buttonVariants({ size: "lg" })}
        >
          {t("newQuiz")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">{t("emptyState")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">{t("columns.title")}</th>
                <th className="px-4 py-3 font-medium">{t("columns.status")}</th>
                <th className="px-4 py-3 font-medium">{t("columns.theme")}</th>
                <th className="px-4 py-3 font-medium">{t("columns.created")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((quiz) => (
                <tr key={quiz.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/quizzes/${quiz.id}`}
                      className="text-foreground hover:underline"
                    >
                      {quiz.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t(`status.${quiz.status}`)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {quiz.theme}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {quiz.createdAt.toLocaleDateString(locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
