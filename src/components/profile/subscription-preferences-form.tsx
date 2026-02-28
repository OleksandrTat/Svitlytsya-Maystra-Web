"use client";

import { FormEvent, useState } from "react";
import { updateSubscriptionPreferencesAction } from "@/actions/auth";

type SubscriptionPreferences = {
  blog_posts: boolean;
  catalog_updates: boolean;
  promotions: boolean;
};

type SubscriptionPreferencesFormProps = {
  email: string;
  initialPreferences: SubscriptionPreferences;
};

export function SubscriptionPreferencesForm({
  email,
  initialPreferences,
}: SubscriptionPreferencesFormProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();

    if (preferences.blog_posts) {
      formData.set("blog_posts", "true");
    }
    if (preferences.catalog_updates) {
      formData.set("catalog_updates", "true");
    }
    if (preferences.promotions) {
      formData.set("promotions", "true");
    }
    if (consent) {
      formData.set("consent", "true");
    }

    const result = await updateSubscriptionPreferencesAction(formData);

    if (!result.ok) {
      setError(result.message);
    } else {
      setMessage(result.message);
    }

    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-8">
      <p className="text-sm text-[var(--color-text-secondary)]">Пошта: {email}</p>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={preferences.blog_posts}
          onChange={(event) =>
            setPreferences((current) => ({ ...current, blog_posts: event.target.checked }))
          }
          className="mt-0.5"
        />
        <span>Нові статті блогу</span>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={preferences.catalog_updates}
          onChange={(event) =>
            setPreferences((current) => ({ ...current, catalog_updates: event.target.checked }))
          }
          className="mt-0.5"
        />
        <span>Нові роботи в каталозі</span>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={preferences.promotions}
          onChange={(event) =>
            setPreferences((current) => ({ ...current, promotions: event.target.checked }))
          }
          className="mt-0.5"
        />
        <span>Акції та новини</span>
      </label>

      <label className="flex items-start gap-3 rounded-xl bg-[var(--color-surface)] px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5"
        />
        <span>Даю згоду на отримання email-розсилки та обробку email для цієї мети.</span>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Збереження..." : "Зберегти налаштування"}
      </button>
    </form>
  );
}
