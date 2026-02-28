"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { updateProfileAction } from "@/actions/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  email: string;
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string;
};

export function ProfileForm({
  userId,
  email,
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
}: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const avatarPreview = useMemo(() => avatarUrl || null, [avatarUrl]);

  const onAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Файл завеликий. Максимум 10MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const safeName = file.name.replace(/\s+/g, "-");
      const objectPath = `${userId}/${Date.now()}-${safeName}`;
      const supabase = createSupabaseBrowserClient();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(objectPath, file, { upsert: true });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(objectPath);
      setAvatarUrl(data.publicUrl);
    } catch {
      setError("Не вдалося завантажити аватар.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.set("display_name", displayName);
    formData.set("bio", bio);
    formData.set("avatar_url", avatarUrl);

    const result = await updateProfileAction(formData);

    if (!result.ok) {
      setError(result.message);
    } else {
      setMessage(result.message);
    }

    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-[var(--color-border)] bg-white p-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-[var(--color-surface)]">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-2xl text-[var(--color-text-secondary)]">
              {displayName.slice(0, 1).toUpperCase() || "U"}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
            {uploading ? "Завантаження..." : "Завантажити аватар"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={onAvatarUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-[var(--color-text-secondary)]">PNG/JPG/WEBP, до 10MB</p>
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
        <input
          type="email"
          value={email}
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-text-secondary)]">Імʼя</span>
        <input
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          minLength={2}
          required
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-text-secondary)]">Коротко про себе</span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-[var(--color-text-secondary)]">Avatar URL</span>
        <input
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <button
        type="submit"
        disabled={saving || uploading}
        className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Збереження..." : "Зберегти профіль"}
      </button>
    </form>
  );
}
