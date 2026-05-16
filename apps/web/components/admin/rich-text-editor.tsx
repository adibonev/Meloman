"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useTranslations } from "next-intl";

// CLAUDE.md §2.2 mandates TipTap for the stories editor. The DB still
// stores HTML in `stories.body`, so this stays drop-in: the parent keeps
// a hidden `name="body"` input fed from `editor.getHTML()`.

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border hover:bg-muted/30"
      }`}
    >
      {label}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const t = useTranslations("AdminStories");
  return (
    <div className="flex flex-wrap gap-1 rounded-t-lg border border-border bg-card px-2 py-2">
      <ToolbarButton
        label={t("rtBold")}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label={t("rtItalic")}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label={t("rtH2")}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <ToolbarButton
        label={t("rtH3")}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      />
      <ToolbarButton
        label={t("rtBullet")}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label={t("rtOrdered")}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label={t("rtQuote")}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
      <ToolbarButton
        label={t("rtUndo")}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        label={t("rtRedo")}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    // Required for Next.js / RSC: render after mount so SSR markup and
    // the client editor don't diverge (TipTap 3 SSR guidance).
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[22rem] rounded-b-lg border border-t-0 border-border bg-background px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    // Pre-mount placeholder keeps layout stable before the editor hydrates.
    return (
      <div className="min-h-[25rem] rounded-lg border border-border bg-card" />
    );
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
