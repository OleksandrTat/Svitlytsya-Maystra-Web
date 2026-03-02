"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { uploadPublicImage } from "@/lib/storage/upload-public-image";

type TiptapEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

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
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
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
      editor.commands.setContent(content, { emitUpdate: false });
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
    setIsUploadingImage(true);
    setError(null);

    try {
      const { publicUrl } = await uploadPublicImage({
        file,
        folder: "blog/editor",
      });

      editor?.chain().focus().setImage({ src: publicUrl }).run();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().setParagraph().run()}
          className={commandButtonClass(Boolean(editor?.isActive("paragraph")))}
          aria-label="Set paragraph"
        >
          P
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setHeading({ level: 1 }).run()}
          disabled={!editor?.can().chain().focus().setHeading({ level: 1 }).run()}
          className={commandButtonClass(Boolean(editor?.isActive("heading", { level: 1 })))}
          aria-label="Toggle heading 1"
        >
          H1
        </button>
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
          onClick={() => editor?.chain().focus().setHeading({ level: 2 }).run()}
          disabled={!editor?.can().chain().focus().setHeading({ level: 2 }).run()}
          className={commandButtonClass(Boolean(editor?.isActive("heading", { level: 2 })))}
          aria-label="Toggle heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setHeading({ level: 3 }).run()}
          disabled={!editor?.can().chain().focus().setHeading({ level: 3 }).run()}
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
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          className={commandButtonClass(false)}
          aria-label="Insert horizontal line"
        >
          H-Line
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
        className="
          min-h-[320px] p-4 text-sm text-[var(--color-text-primary)]
          [&_.ProseMirror]:min-h-[300px]
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_h1]:mb-4
          [&_.ProseMirror_h1]:mt-8
          [&_.ProseMirror_h1]:text-3xl
          [&_.ProseMirror_h1]:font-semibold
          [&_.ProseMirror_h2]:mb-3
          [&_.ProseMirror_h2]:mt-7
          [&_.ProseMirror_h2]:text-2xl
          [&_.ProseMirror_h2]:font-semibold
          [&_.ProseMirror_h3]:mb-3
          [&_.ProseMirror_h3]:mt-6
          [&_.ProseMirror_h3]:text-xl
          [&_.ProseMirror_h3]:font-semibold
          [&_.ProseMirror_p]:my-3
          [&_.ProseMirror_ul]:my-3
          [&_.ProseMirror_ul]:list-disc
          [&_.ProseMirror_ul]:pl-6
          [&_.ProseMirror_ol]:my-3
          [&_.ProseMirror_ol]:list-decimal
          [&_.ProseMirror_ol]:pl-6
          [&_.ProseMirror_li]:my-1
          [&_.ProseMirror_blockquote]:my-4
          [&_.ProseMirror_blockquote]:border-l-4
          [&_.ProseMirror_blockquote]:border-[var(--color-border)]
          [&_.ProseMirror_blockquote]:pl-4
          [&_.ProseMirror_blockquote]:italic
          [&_.ProseMirror_pre]:my-4
          [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_pre]:rounded-xl
          [&_.ProseMirror_pre]:bg-black
          [&_.ProseMirror_pre]:p-4
          [&_.ProseMirror_pre]:text-xs
          [&_.ProseMirror_pre]:text-white
          [&_.ProseMirror_code]:rounded
          [&_.ProseMirror_code]:bg-[var(--color-surface)]
          [&_.ProseMirror_code]:px-1
          [&_.ProseMirror_code]:py-0.5
          [&_.ProseMirror_a]:text-blue-600
          [&_.ProseMirror_a]:underline
          [&_.ProseMirror_a]:decoration-blue-600/70
          [&_.ProseMirror_a:hover]:text-blue-700
          [&_.ProseMirror_img]:my-4
          [&_.ProseMirror_img]:h-auto
          [&_.ProseMirror_img]:max-w-full
          [&_.ProseMirror_img]:rounded-xl
          [&_.ProseMirror_img]:border
          [&_.ProseMirror_img]:border-[var(--color-border)]
          [&_.ProseMirror_hr]:my-8
          [&_.ProseMirror_hr]:mx-0
          [&_.ProseMirror_hr]:h-px
          [&_.ProseMirror_hr]:w-full
          [&_.ProseMirror_hr]:border-0
          [&_.ProseMirror_hr]:bg-slate-300
        "
        onDrop={(event) => {
          const file = event.dataTransfer?.files?.[0];
          if (!file) {
            return;
          }

          event.preventDefault();
          void uploadImage(file);
        }}
        onPaste={(event) => {
          const file = event.clipboardData?.files?.[0];
          if (!file) {
            return;
          }

          event.preventDefault();
          void uploadImage(file);
        }}
      />

      {error ? (
        <p className="border-t border-[var(--color-border)] bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>
      ) : null}
    </div>
  );
}

