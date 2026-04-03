import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderCard } from "@/components/orders/order-card";
import { ProfileLayout } from "@/components/layout/profile-layout";
import { PageHero } from "@/components/ui/page-hero";
import { getClientOrders } from "@/lib/data/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

const FILTERS = [
  { key: "active", label: "Активні" },
  { key: "completed", label: "Завершені" },
  { key: "all", label: "Всі" },
] as const;

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
    <>
      <PageHero
        title="Мої замовлення"
        breadcrumbs={[
          { label: "Головна", href: "/" },
          { label: "Профіль", href: "/profile" },
          { label: "Замовлення" },
        ]}
        height="h-[180px]"
      />
      <ProfileLayout>
        <div>
          {/* Filter tabs */}
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={`/profile/orders?filter=${f.key}`}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  filter === f.key
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-bg-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-100)] hover:text-[var(--color-primary)]",
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-warm)] p-8 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                У вас ще немає замовлень.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
              >
                Залишити заявку
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </ProfileLayout>
    </>
  );
}
