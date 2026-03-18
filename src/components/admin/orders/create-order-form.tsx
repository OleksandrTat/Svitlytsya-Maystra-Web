"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrderFromInquiryAction } from "@/actions/orders";
import { ORDER_PRIORITY_LABELS } from "@/lib/constants";
import { formatInquiryDate } from "@/lib/utils";
import type { Inquiry } from "@/lib/types";
import type { OrderTemplate } from "@/lib/admin/config";
import { TemplatePicker } from "@/components/admin/orders/template-picker";

type CreateOrderFormState = {
  inquiry_id: string;
  user_id: string;
  expected_date: string;
  priority: "normal" | "urgent";
  internal_notes: string;
};

const initialState: CreateOrderFormState = {
  inquiry_id: "",
  user_id: "",
  expected_date: "",
  priority: "normal",
  internal_notes: "",
};

export function CreateOrderForm({
  inquiries,
  templates,
}: {
  inquiries: Inquiry[];
  templates: OrderTemplate[];
}) {
  const [form, setForm] = useState<CreateOrderFormState>(initialState);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    const fd = new FormData();
    fd.set("inquiry_id", form.inquiry_id);
    fd.set("user_id", form.user_id);
    fd.set("expected_date", form.expected_date);
    fd.set("priority", form.priority);
    fd.set("internal_notes", form.internal_notes);

    startTransition(() => {
      toast.promise(createOrderFromInquiryAction(fd), {
        loading: "Створюємо замовлення...",
        success: (result) => {
          if (!result.ok) {
            throw new Error(result.message);
          }
          setForm(initialState);
          router.refresh();
          return "Замовлення створено.";
        },
        error: "Не вдалося створити замовлення.",
      });
    });
  };

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Створити замовлення із заявки
      </h2>

      <div className="mt-4">
        <TemplatePicker
          templates={templates}
          onSelect={(defaults) => {
            setForm((current) => ({
              ...current,
              user_id:
                typeof defaults.user_id === "string" ? defaults.user_id : current.user_id,
              expected_date:
                typeof defaults.expected_date === "string"
                  ? defaults.expected_date
                  : current.expected_date,
              priority:
                defaults.priority === "urgent" || defaults.priority === "normal"
                  ? defaults.priority
                  : current.priority,
              internal_notes:
                typeof defaults.internal_notes === "string"
                  ? defaults.internal_notes
                  : current.internal_notes,
              inquiry_id:
                typeof defaults.inquiry_id === "string"
                  ? defaults.inquiry_id
                  : current.inquiry_id,
            }));
          }}
        />
      </div>

      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <select
          required
          value={form.inquiry_id}
          onChange={(event) => setForm((current) => ({ ...current, inquiry_id: event.target.value }))}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
        >
          <option value="">Оберіть заявку</option>
          {inquiries.map((inquiry) => (
            <option key={inquiry.id} value={inquiry.id}>
              {inquiry.name} · {inquiry.service_type} · {formatInquiryDate(inquiry.created_at)}
            </option>
          ))}
        </select>

        <input
          value={form.user_id}
          onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))}
          placeholder="Client user_id (optional)"
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={form.expected_date}
          onChange={(event) => setForm((current) => ({ ...current, expected_date: event.target.value }))}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        />

        <select
          value={form.priority}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              priority: event.target.value === "urgent" ? "urgent" : "normal",
            }))
          }
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          {Object.entries(ORDER_PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input
          value={form.internal_notes}
          onChange={(event) =>
            setForm((current) => ({ ...current, internal_notes: event.target.value }))
          }
          placeholder="Internal notes"
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2 md:justify-self-start"
        >
          {pending ? "Створюємо..." : "Створити замовлення"}
        </button>
      </form>
    </section>
  );
}
