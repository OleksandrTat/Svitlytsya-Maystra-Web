"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createInvoiceFromOrderAction,
  updateInvoiceStatusAction,
  registerPaymentAction,
} from "@/actions/admin/invoices";
import type { Invoice, Payment } from "@/lib/types";

const INVOICE_STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Чернетка",
  sent: "Надіслано",
  paid: "Оплачено",
  partial: "Часткова оплата",
  overdue: "Прострочено",
  cancelled: "Скасовано",
};

const STATUS_COLORS: Record<Invoice["status"], string> = {
  draft: "bg-zinc-100 text-zinc-700",
  sent: "bg-sky-100 text-sky-800",
  paid: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-zinc-100 text-zinc-500",
};

type Props = {
  orderId: string;
  invoices: Invoice[];
  payments: Payment[];
};

export function OrderInvoicesPanel({ orderId, invoices, payments }: Props) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalInvoiced = invoices
    .filter((invoice) => invoice.status !== "cancelled")
    .reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Рахунки та оплати</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm((value) => !value)}
          className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white"
        >
          + Новий рахунок
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[var(--color-surface)] p-3 text-sm">
        <div>
          <p className="text-xs text-[var(--color-text-secondary)]">Виставлено</p>
          <p className="font-semibold">{totalInvoiced.toLocaleString("uk-UA")} грн</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-secondary)]">Оплачено</p>
          <p className="font-semibold text-green-700">{totalPaid.toLocaleString("uk-UA")} грн</p>
        </div>
      </div>

      {showCreateForm && (
        <form
          action={async (formData) => {
            const result = await createInvoiceFromOrderAction(formData);
            if (result.ok) {
              toast.success(result.message);
              setShowCreateForm(false);
              router.refresh();
            } else {
              toast.error(result.message);
            }
          }}
          className="mt-4 grid gap-3 rounded-xl border border-[var(--color-border)] p-3"
        >
          <input type="hidden" name="order_id" value={orderId} />
          <label className="space-y-1 text-xs">
            <span className="text-[var(--color-text-secondary)]">Сума (грн)</span>
            <input
              name="total"
              type="number"
              min="0"
              step="0.01"
              required
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-[var(--color-text-secondary)]">Дедлайн оплати</span>
            <input
              name="due_date"
              type="date"
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-[var(--color-text-secondary)]">Примітки</span>
            <input
              name="notes"
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white"
          >
            Створити рахунок
          </button>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {invoices.length === 0 && (
          <p className="text-sm text-[var(--color-text-secondary)]">Рахунків ще немає.</p>
        )}
        {invoices.map((invoice) => (
          <div key={invoice.id} className="rounded-xl border border-[var(--color-border)] p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{invoice.invoice_number}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {invoice.total.toLocaleString("uk-UA")} грн
                  {invoice.paid_amount > 0
                    ? ` · Оплачено: ${invoice.paid_amount.toLocaleString("uk-UA")} грн`
                    : ""}
                  {invoice.due_date ? ` · До: ${invoice.due_date}` : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[invoice.status]}`}
              >
                {INVOICE_STATUS_LABELS[invoice.status]}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {invoice.status === "draft" && (
                <form
                  action={async (formData) => {
                    const result = await updateInvoiceStatusAction(formData);
                    if (result.ok) {
                      toast.success(result.message);
                      router.refresh();
                    } else {
                      toast.error(result.message);
                    }
                  }}
                >
                  <input type="hidden" name="id" value={invoice.id} />
                  <input type="hidden" name="status" value="sent" />
                  <input type="hidden" name="order_id" value={orderId} />
                  <button type="submit" className="text-xs underline text-[var(--color-primary)]">
                    Позначити як надіслано
                  </button>
                </form>
              )}
              {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(invoice.id)}
                  className="text-xs underline text-emerald-700"
                >
                  + Зареєструвати оплату
                </button>
              )}
            </div>

            {showPaymentForm === invoice.id && (
              <form
                action={async (formData) => {
                  const result = await registerPaymentAction(formData);
                  if (result.ok) {
                    toast.success(result.message);
                    setShowPaymentForm(null);
                    router.refresh();
                  } else {
                    toast.error(result.message);
                  }
                }}
                className="mt-3 grid gap-2 rounded-lg bg-[var(--color-surface)] p-3"
              >
                <input type="hidden" name="invoice_id" value={invoice.id} />
                <input type="hidden" name="order_id" value={orderId} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 text-xs">
                    <span>Сума</span>
                    <input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={invoice.total - invoice.paid_amount}
                      required
                      className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span>Метод</span>
                    <select
                      name="method"
                      className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-sm"
                    >
                      <option value="bank_transfer">Банк. переказ</option>
                      <option value="cash">Готівка</option>
                      <option value="card">Картка</option>
                      <option value="other">Інше</option>
                    </select>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Зберегти
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(null)}
                    className="rounded-lg border px-3 py-1.5 text-xs"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>

      {payments.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)]">Оплати</p>
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]"
              >
                <span>
                  {new Date(payment.paid_at).toLocaleDateString("uk-UA")} · {payment.method}
                </span>
                <span className="font-semibold text-green-700">
                  +{payment.amount.toLocaleString("uk-UA")} грн
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
