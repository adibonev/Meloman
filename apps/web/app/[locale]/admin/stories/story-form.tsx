"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

export type StoryFormState = { error?: string };

type StoryFormValues = {
  slug?: string;
  title?: string;
  subtitle?: string;
  artistName?: string;
  year?: number | null;
  body?: string;
  coverImageUrl?: string;
  heroImageUrl?: string;
  youtubeUrl?: string;
  spotifyUri?: string;
  tags?: string[];
  published?: boolean;
};

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

export function StoryForm({
  action,
  initial,
  isEdit,
}: {
  action: (
    prev: StoryFormState,
    formData: FormData
  ) => Promise<StoryFormState>;
  initial?: StoryFormValues;
  isEdit: boolean;
}) {
  const t = useTranslations("AdminStories");
  const [body, setBody] = useState(initial?.body ?? "");
  const [state, formAction] = useActionState<StoryFormState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        {!isEdit && (
          <label className="block">
            <span className="text-sm text-muted-foreground">{t("slug")}</span>
            <input
              name="slug"
              defaultValue={initial?.slug}
              placeholder="авто от заглавието / auto from title"
              className={inputCls}
            />
          </label>
        )}
        <label className="block">
          <span className="text-sm text-muted-foreground">
            {t("storyTitle")}
          </span>
          <input
            name="title"
            required
            defaultValue={initial?.title}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted-foreground">
            {t("subtitle")}
          </span>
          <input
            name="subtitle"
            defaultValue={initial?.subtitle}
            className={inputCls}
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-muted-foreground">
              {t("artist")}
            </span>
            <input
              name="artistName"
              defaultValue={initial?.artistName}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">{t("year")}</span>
            <input
              name="year"
              type="number"
              defaultValue={initial?.year ?? undefined}
              className={inputCls}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-muted-foreground">{t("cover")}</span>
          <input
            name="coverImageUrl"
            defaultValue={initial?.coverImageUrl}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted-foreground">{t("hero")}</span>
          <input
            name="heroImageUrl"
            defaultValue={initial?.heroImageUrl}
            className={inputCls}
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-muted-foreground">
              {t("youtube")}
            </span>
            <input
              name="youtubeUrl"
              defaultValue={initial?.youtubeUrl}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">
              {t("spotify")}
            </span>
            <input
              name="spotifyUri"
              defaultValue={initial?.spotifyUri}
              className={inputCls}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-muted-foreground">{t("tags")}</span>
          <input
            name="tags"
            defaultValue={initial?.tags?.join(", ")}
            className={inputCls}
          />
        </label>
        {isEdit && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial?.published}
            />
            <span className="text-sm">{t("publish")}</span>
          </label>
        )}
        {state.error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t("invalid")}
          </p>
        )}
        <Button type="submit" size="lg">
          {t("save")}
        </Button>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">{t("body")}</span>
        {/* TipTap is WYSIWYG, so it doubles as the preview — the old
            separate HTML textarea + preview pane is gone. The hidden
            input keeps the FormData contract (`name="body"`, HTML
            string) so the server action is unchanged. */}
        <RichTextEditor value={body} onChange={setBody} />
        <input type="hidden" name="body" value={body} />
      </div>
    </form>
  );
}
