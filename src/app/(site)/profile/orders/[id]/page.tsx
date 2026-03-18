import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Container } from "@/components/ui/container";
import {
  getClientOrderById,
  getClientOrderMessages,
  getClientOrderTimeline,
  getInvoicesByOrderForClient,
} from "@/lib/data/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = {
  id: string;
};

export default async function ProfileOrderDetailsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const [order, timeline, messages, invoices] = await Promise.all([
    getClientOrderById(id, user.id),
    getClientOrderTimeline(id, user.id),
    getClientOrderMessages(id, user.id),
    getInvoicesByOrderForClient(id, user.id),
  ]);

  if (!order) {
    redirect("/profile/orders");
  }

  return (
    <section className="py-16">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl text-[var(--color-text-primary)]">
            Замовлення {order.order_number}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <article className="rounded-3xl border border-[var(--color-border)] bg-white p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Деталі</h2>
              <dl className="mt-4 grid gap-3 text-sm text-[var(--color-text-secondary)]">
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Очікувана дата</dt>
                  <dd>{order.expected_date ?? "-"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Фактична дата</dt>
                  <dd>{order.actual_date ?? "-"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Нотатки</dt>
                  <dd>{order.internal_notes ?? "-"}</dd>
                </div>
              </dl>

              <Link
                href={`/profile/orders/${order.id}/messages`}
                className="mt-6 inline-block text-sm font-medium text-[var(--color-primary)] underline"
              >
                Відкрити чат замовлення ({messages.length})
              </Link>
            </article>

            {invoices.length > 0 && (
              <article className="rounded-3xl border border-[var(--color-border)] bg-white p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Рахунки</h2>
                <div className="mt-4 space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="rounded-xl border border-[var(--color-border)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{invoice.invoice_number}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {invoice.total.toLocaleString("uk-UA")} грн
                            {invoice.due_date &&
                              ` · До: ${new Date(invoice.due_date).toLocaleDateString("uk-UA")}`}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : invoice.status === "overdue"
                                ? "bg-red-100 text-red-800"
                                : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {invoice.status === "paid"
                            ? "Оплачено"
                            : invoice.status === "overdue"
                              ? "Прострочено"
                              : invoice.status === "partial"
                                ? "Часткова оплата"
                                : "Очікує оплати"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </div>

          <article>
            <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">Таймлайн</h2>
            <OrderTimeline items={timeline} />
          </article>
        </div>
      </Container>
    </section>
  );
}
