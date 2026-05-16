import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { stories } from "@meloman/db/schema";
import { Link } from "@/i18n/navigation";
import { StoryForm, type StoryFormState } from "../story-form";
import { updateStoryAction } from "../actions";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AdminStories");

  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, id))
    .limit(1);

  if (!story) notFound();

  async function action(
    _prev: StoryFormState,
    formData: FormData
  ): Promise<StoryFormState> {
    "use server";
    const result = await updateStoryAction(id, formData);
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
        {t("edit")}: {story.title}
      </h1>
      <StoryForm
        action={action}
        isEdit
        initial={{
          slug: story.slug,
          title: story.title,
          subtitle: story.subtitle ?? "",
          artistName: story.artistName ?? "",
          year: story.year,
          body: story.body,
          coverImageUrl: story.coverImageUrl ?? "",
          heroImageUrl: story.heroImageUrl ?? "",
          youtubeUrl: story.youtubeUrl ?? "",
          spotifyUri: story.spotifyUri ?? "",
          tags: Array.isArray(story.tags) ? (story.tags as string[]) : [],
          published: story.publishedAt !== null,
        }}
      />
    </div>
  );
}
