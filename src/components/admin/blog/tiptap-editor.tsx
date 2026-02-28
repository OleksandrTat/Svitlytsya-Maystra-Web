"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TiptapEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Напишіть текст статті..." }),
    ],
    content,
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML());
    },
  });

  const uploadImage = async (file: File) => {
    const supabase = createSupabaseBrowserClient();
    const path = `blog/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const { error } = await supabase.storage.from("blog-images").upload(path, file, {
      upsert: true,
    });

    if (error) {
      return;
    }

    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    editor?.chain().focus().setImage({ src: data.publicUrl }).run();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className="rounded border border-[var(--color-border)] px-2 py-1 text-xs"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className="rounded border border-[var(--color-border)] px-2 py-1 text-xs"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className="rounded border border-[var(--color-border)] px-2 py-1 text-xs"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className="rounded border border-[var(--color-border)] px-2 py-1 text-xs"
        >
          List
        </button>
        <label className="cursor-pointer rounded border border-[var(--color-border)] px-2 py-1 text-xs">
          Фото
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadImage(file);
              }
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <EditorContent
        editor={editor}
        className="min-h-[320px] p-4 text-sm text-[var(--color-text-primary)] [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}
