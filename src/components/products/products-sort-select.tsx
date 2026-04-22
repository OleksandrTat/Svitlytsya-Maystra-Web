"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ProductFilters } from "@/lib/data/queries";

export function ProductsSortSelect({ current }: { current: ProductFilters["sort"] }) {
  const t = useTranslations("productsPage.sort");
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
      aria-label={t("ariaLabel")}
    >
      <option value="default">{t("default")}</option>
      <option value="price_asc">{t("priceAsc")}</option>
      <option value="price_desc">{t("priceDesc")}</option>
      <option value="newest">{t("newest")}</option>
    </select>
  );
}
