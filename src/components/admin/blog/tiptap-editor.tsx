"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TiptapEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function getFileSafeName(value: string) {
  return value.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Write the article content...",
}: TiptapEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto", "tel"],
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure(),
    ],
    content,
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  const plainTextStats = useMemo(() => {
    const words = stripHtml(content)
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean).length;

    return {
      words,
      chars: stripHtml(content).trim().length,
    };
  }, [content]);

  const commandButtonClass = (active = false) =>
    [
      "rounded border px-2 py-1 text-xs",
      active
        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        : "border-[var(--color-border)] hover:bg-white",
    ].join(" ");

  const handleLinkToggle = () => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("Enter URL", previousUrl ?? "");

    if (nextUrl === null) {
      return;
    }

    const trimmed = nextUrl.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const uploadImage = async (file: File) => {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      setError("Unsupported image format. Use PNG, JPG or WEBP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Image is too large. Maximum size is 10 MB.");
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const path = `blog/${Date.now()}-${getFileSafeName(file.name) || "image"}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(path, file, {
          upsert: true,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      editor?.chain().focus().setImage({ src: data.publicUrl }).run();
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={commandButtonClass(Boolean(editor?.isActive("bold")))}
          aria-label="Toggle bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={commandButtonClass(Boolean(editor?.isActive("italic")))}
          aria-label="Toggle italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={commandButtonClass(Boolean(editor?.isActive("strike")))}
          aria-label="Toggle strikethrough"
        >
          S
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={commandButtonClass(Boolean(editor?.isActive("heading", { level: 2 })))}
          aria-label="Toggle heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={commandButtonClass(Boolean(editor?.isActive("heading", { level: 3 })))}
          aria-label="Toggle heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={commandButtonClass(Boolean(editor?.isActive("bulletList")))}
          aria-label="Toggle bullet list"
        >
          UL
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={commandButtonClass(Boolean(editor?.isActive("orderedList")))}
          aria-label="Toggle ordered list"
        >
          OL
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={commandButtonClass(Boolean(editor?.isActive("blockquote")))}
          aria-label="Toggle quote"
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={commandButtonClass(Boolean(editor?.isActive("codeBlock")))}
          aria-label="Toggle code block"
        >
          Code
        </button>
        <button
          type="button"
          onClick={handleLinkToggle}
          className={commandButtonClass(Boolean(editor?.isActive("link")))}
          aria-label="Set or unset link"
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          className={commandButtonClass(false)}
          aria-label="Clear formatting"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().chain().focus().undo().run()}
          className={`${commandButtonClass(false)} disabled:cursor-not-allowed disabled:opacity-50`}
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().chain().focus().redo().run()}
          className={`${commandButtonClass(false)} disabled:cursor-not-allowed disabled:opacity-50`}
          aria-label="Redo"
        >
          Redo
        </button>
        <label
          className={`${commandButtonClass(false)} cursor-pointer ${isUploadingImage ? "pointer-events-none opacity-60" : ""}`}
        >
          {isUploadingImage ? "Uploading..." : "Image"}
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
            disabled={isUploadingImage}
          />
        </label>
        <div className="ml-auto flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <span>{plainTextStats.words} words</span>
          <span>{plainTextStats.chars} chars</span>
        </div>
      </div>

      <EditorContent
        editor={editor}
        className="min-h-[320px] p-4 text-sm text-[var(--color-text-primary)] [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none"
      />

      {error ? (
        <p className="border-t border-[var(--color-border)] bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
