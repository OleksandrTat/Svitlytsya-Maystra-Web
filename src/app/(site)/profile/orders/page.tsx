import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderCard } from "@/components/orders/order-card";
import { Container } from "@/components/ui/container";
import { getClientOrders } from "@/lib/data/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProfileOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
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

  const params = await searchParams;
  const rawFilter = typeof params.filter === "string" ? params.filter : "active";
  const filter = rawFilter === "all" || rawFilter === "completed" ? rawFilter : "active";
  const orders = await getClientOrders(user.id, filter);

  return (
    <section className="py-16">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl text-[var(--color-text-primary)]">Мої замовлення</h1>
          <div className="flex gap-2 text-sm">
            <Link href="/profile/orders?filter=active" className="underline">
              Активні
            </Link>
            <Link href="/profile/orders?filter=completed" className="underline">
              Завершені
            </Link>
            <Link href="/profile/orders?filter=all" className="underline">
              Всі
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[var(--color-border)] bg-white p-8">
            <p className="text-sm text-[var(--color-text-secondary)]">
              У вас ще немає замовлень.
            </p>
            <Link href="/contact" className="mt-4 inline-block text-sm font-medium underline">
              Залишити заявку
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
