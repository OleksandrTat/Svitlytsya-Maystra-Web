import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Container } from "@/components/ui/container";
import {
  getClientOrderById,
  getClientOrderMessages,
  getClientOrderTimeline,
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
  const [order, timeline, messages] = await Promise.all([
    getClientOrderById(id, user.id),
    getClientOrderTimeline(id, user.id),
    getClientOrderMessages(id, user.id),
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
          <article className="rounded-3xl border border-[var(--color-border)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Деталі</h2>
            <dl className="mt-4 grid gap-3 text-sm text-[var(--color-text-secondary)]">
              <div>
                <dt className="font-semibold text-[var(--color-text-primary)]">Expected date</dt>
                <dd>{order.expected_date ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--color-text-primary)]">Actual date</dt>
                <dd>{order.actual_date ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--color-text-primary)]">Notes</dt>
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

          <article>
            <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">Таймлайн</h2>
            <OrderTimeline items={timeline} />
          </article>
        </div>
      </Container>
    </section>
  );
}
