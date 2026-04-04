import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getWishlistStatsForAdmin } from "@/lib/data/queries";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export default async function AdminWishlistPage() {
  const [t, topProducts] = await Promise.all([
    getTranslations("admin.pages.wishlist"),
    getWishlistStatsForAdmin(),
  ]);

  const supabase = createSupabaseServiceClient();
  let totalEntries = 0;
  if (supabase) {
    const { count } = await supabase
      .from("wishlist_items")
      .select("*", { count: "exact", head: true });
    totalEntries = count ?? 0;
  }

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">
              {t("totalEntries")}
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {totalEntries}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">
              {t("uniqueProducts")}
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {topProducts.length}
            </p>
          </div>
        </div>

        {/* Top products table */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white">
          <div className="border-b border-[var(--color-border)] px-5 py-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t("topProducts")}
            </h3>
          </div>

          {topProducts.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-6 text-center text-xs font-bold text-[var(--color-text-muted)]">
                    {i + 1}
                  </span>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-section)]">
                    {product.cover_image ? (
                      <Image
                        src={product.cover_image}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] text-[var(--color-text-muted)]">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {product.title}
                    </p>
                    {product.price_from && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {t("priceFrom", { amount: product.price_from.toLocaleString("uk-UA") })}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                    {product.wishlist_count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
              {t("noData")}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
