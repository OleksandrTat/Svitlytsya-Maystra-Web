import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWishlistProductsAction } from "@/actions/wishlist";
import { WishlistGrid } from "@/components/products/wishlist-grid";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Бажане",
};

export default async function WishlistPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const products = (await getWishlistProductsAction()) as Product[];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-[var(--color-text-primary)]">
        Бажане
      </h1>

      {products.length > 0 ? (
        <WishlistGrid products={products} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg-section)]">
            <Heart size={28} className="text-[var(--color-text-muted)]" />
          </div>
          <p className="font-display text-xl text-[var(--color-text-primary)]">
            Поки що нічого немає
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Додавайте вподобані товари натисканням на серце
          </p>
          <Link
            href="/products"
            className="mt-2 inline-flex h-10 items-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
          >
            Переглянути продукти
          </Link>
        </div>
      )}
    </div>
  );
}
