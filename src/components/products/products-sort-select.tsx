"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductFilters } from "@/lib/data/queries";

export function ProductsSortSelect({ current }: { current: ProductFilters["sort"] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: ProductFilters["sort"]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "default") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    params.delete("page");
    const nextSearch = params.toString();
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  };

  return (
    <select
      value={current}
      onChange={(event) => onChange(event.target.value as ProductFilters["sort"])}
      className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
      aria-label="Сортування продуктів"
    >
      <option value="default">За замовчуванням</option>
      <option value="price_asc">Ціна: від низької</option>
      <option value="price_desc">Ціна: від високої</option>
      <option value="newest">Новинки</option>
    </select>
  );
}
