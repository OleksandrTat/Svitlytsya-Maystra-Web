"use client";

import { useFormStatus } from "react-dom";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)] disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Зберігаємо..." : label}
    </button>
  );
}

export function AdminActionForm({
  action,
  children,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<unknown> | unknown;
  children: React.ReactNode;
  submitLabel: string;
}) {
  return (
    <form
      action={action as (formData: FormData) => void | Promise<void>}
      className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      {children}
      <SubmitButton label={submitLabel} />
    </form>
  );
}

