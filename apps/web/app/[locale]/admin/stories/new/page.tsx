import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StoryForm, type StoryFormState } from "../story-form";
import { createStoryAction } from "../actions";

export default async function NewStoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminStories");

  async function action(
    _prev: StoryFormState,
    formData: FormData
  ): Promise<StoryFormState> {
    "use server";
    const result = await createStoryAction(formData);
    return result?.errorKey ? { error: result.errorKey } : {};
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/stories"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← {t("backToList")}
      </Link>
      <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
        {t("newStory")}
      </h1>
      <StoryForm action={action} isEdit={false} />
    </div>
  );
}
