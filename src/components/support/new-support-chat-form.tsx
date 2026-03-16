"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { startSupportChatAction } from "@/actions/support";
import type { SupportChannel } from "@/lib/types";

const CHANNELS: { value: SupportChannel; label: string; hint: string }[] = [
  { value: "internal", label: "Чат на сайті", hint: "Відповімо у вашому особистому кабінеті" },
  { value: "email", label: "Email", hint: "Відповімо на вашу пошту" },
  { value: "viber", label: "Viber", hint: "Вкажіть номер телефону" },
  { value: "whatsapp", label: "WhatsApp", hint: "Вкажіть номер телефону" },
];

export function NewSupportChatForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<SupportChannel>("internal");
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("channel", channel);

    startTransition(() => {
      startSupportChatAction(formData).then((result) => {
        if (result.ok) {
          toast.success(result.message);
          if (result.chatId) {
            router.push(`/profile/support/${result.chatId}`);
          } else {
            setOpen(false);
          }
        } else {
          toast.error(result.message);
        }
      });
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-[var(--color-border)] py-6 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface)]"
      >
        + Нове звернення
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Нове звернення</h2>

      <div>
        <p className="mb-2 text-sm text-[var(--color-text-secondary)]">
          Як вам зручно отримати відповідь?
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CHANNELS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setChannel(option.value)}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                channel === option.value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="mt-0.5 text-xs opacity-70">{option.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {(channel === "viber" || channel === "whatsapp") && (
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">
            Ваш номер для {channel === "viber" ? "Viber" : "WhatsApp"}
          </span>
          <input
            name="preferred_contact"
            type="tel"
            required
            placeholder="+380XXXXXXXXX"
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>
      )}

      <label className="block space-y-1 text-sm">
        <span className="text-[var(--color-text-secondary)]">Тема (необов'язково)</span>
        <input
          name="subject"
          placeholder="Коротко про що питання"
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-[var(--color-text-secondary)]">Повідомлення *</span>
        <textarea
          name="content"
          required
          rows={4}
          placeholder="Опишіть ваше питання або проблему..."
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Надсилаємо..." : "Надіслати"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm"
        >
          Скасувати
        </button>
      </div>
    </form>
  );
}
