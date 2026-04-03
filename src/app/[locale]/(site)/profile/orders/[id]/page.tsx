import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { ProfileLayout } from "@/components/layout/profile-layout";
import { PageHero } from "@/components/ui/page-hero";
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
    <>
      <PageHero
        title={`Замовлення ${order.order_number}`}
        breadcrumbs={[
          { label: "Головна", href: "/" },
          { label: "Профіль", href: "/profile" },
          { label: "Замовлення", href: "/profile/orders" },
          { label: order.order_number },
        ]}
        height="h-[180px]"
      />
      <ProfileLayout>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/profile/orders"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-700)]"
            >
              <ArrowLeft size={16} />
              Всі замовлення
            </Link>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            {/* Details card */}
            <div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                Деталі
              </h2>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Очікувана дата
                  </dt>
                  <dd className="mt-1 font-medium text-[var(--color-text-primary)]">
                    {order.expected_date
                      ? new Date(order.expected_date).toLocaleDateString("uk-UA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Фактична дата
                  </dt>
                  <dd className="mt-1 font-medium text-[var(--color-text-primary)]">
                    {order.actual_date
                      ? new Date(order.actual_date).toLocaleDateString("uk-UA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </dd>
                </div>
                {order.internal_notes && (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      Нотатки
                    </dt>
                    <dd className="mt-1 text-[var(--color-text-secondary)]">
                      {order.internal_notes}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="border-t border-[var(--color-border)] pt-4">
                <Link
                  href={`/profile/orders/${order.id}/messages`}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
                >
                  <MessageSquare size={16} />
                  Чат замовлення ({messages.length})
                </Link>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="mb-4 font-display text-xl font-semibold text-[var(--color-text-primary)]">
                Таймлайн
              </h2>
              <OrderTimeline items={timeline} />
            </div>
          </div>
        </div>
      </ProfileLayout>
    </>
  );
}
