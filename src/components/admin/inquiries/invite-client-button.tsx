"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { createClientAccountFromInquiryAction } from "@/actions/admin/clients";

type Props = {
  inquiryId: string;
  inquiryName: string;
  inquiryEmail: string | null;
  orderId?: string;
};

export function InviteClientButton({ inquiryId, inquiryName, inquiryEmail, orderId }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(inquiryEmail ?? "");
  const [pending, startTransition] = useTransition();

  const send = () => {
    const formData = new FormData();
    formData.set("inquiry_id", inquiryId);
    formData.set("email", email);
    formData.set("display_name", inquiryName);
    if (orderId) {
      formData.set("order_id", orderId);
    }

    startTransition(() => {
      createClientAccountFromInquiryAction(formData).then((result) => {
        if (result.ok) {
          toast.success(result.message);
          setOpen(false);
        } else {
          toast.error(result.message);
        }
      });
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
      >
        <UserPlus size={14} />
        Запросити клієнта
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-[var(--color-border)] bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-[var(--color-text-primary)]">
            Надіслати запрошення
          </p>
          <label className="block space-y-1 text-xs">
            <span className="text-[var(--color-text-secondary)]">Email клієнта</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
              placeholder="client@example.com"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={send}
              disabled={pending || !email.trim()}
              className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Надсилаємо..." : "Надіслати"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border px-3 py-1.5 text-xs"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </>
  );
}
