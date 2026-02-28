"use client";

import { FormEvent, useState } from "react";
import { addCommentAction } from "@/actions/comments";

type CommentFormProps = {
  postId: string;
  postSlug: string;
  parentId?: string;
};

export function CommentForm({ postId, postSlug, parentId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.set("post_id", postId);
    formData.set("post_slug", postSlug);
    formData.set("content", content);
    if (parentId) {
      formData.set("parent_id", parentId);
    }

    const result = await addCommentAction(formData);

    if (!result.ok) {
      setError(result.message);
    } else {
      setMessage(result.message);
      setContent("");
    }

    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        maxLength={2000}
        required
        placeholder="Напишіть ваш коментар..."
        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <button
        type="submit"
        disabled={saving || content.trim().length === 0}
        className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Надсилання..." : "Надіслати коментар"}
      </button>
    </form>
  );
}
