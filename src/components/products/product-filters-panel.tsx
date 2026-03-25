"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, RotateCcw, Search } from "lucide-react";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import type { CategoryOption, ProductFilters } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

function parseCsv(value: string | null) {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function updateCsv(values: string[], value: string) {
  if (values.includes(value)) return values.filter((item) => item !== value);
  return [...values, value];
}

type Props = {
  filters: ProductFilters;
  categoryOptions: CategoryOption[];
  styleOptions: string[];
  materialOptions: string[];
};

function FilterBlock({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--color-border)] pb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-[var(--color-text-muted)] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProductFiltersPanel({
  filters,
  categoryOptions,
  styleOptions,
  materialOptions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentParams = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams],
  );

  const setParam = useCallback(
    (key: string, value?: string) => {
      const params = new URLSearchParams(currentParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      const nextSearch = params.toString();
      router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname);
    },
    [currentParams, pathname, router],
  );

  const toggleParamValue = useCallback(
    (key: string, value: string) => {
      const values = parseCsv(searchParams.get(key));
      const next = updateCsv(values, value);
      setParam(key, next.length ? next.join(",") : undefined);
    },
    [searchParams, setParam],
  );

  // Search with debounce
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setParam("search", value.trim() || undefined);
    }, 400);
  };

  // Price with debounce
  const [priceMin, setPriceMin] = useState(filters.priceMin?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(filters.priceMax?.toString() ?? "");
  const priceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setPriceMin(filters.priceMin?.toString() ?? "");
    setPriceMax(filters.priceMax?.toString() ?? "");
  }, [filters.priceMin, filters.priceMax]);

  const handlePriceChange = (key: "price_min" | "price_max", value: string) => {
    if (key === "price_min") setPriceMin(value);
    else setPriceMax(value);
    clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      setParam(key, value.trim() || undefined);
    }, 600);
  };

  const hasActiveFilters =
    !!filters.category ||
    filters.styles.length > 0 ||
    filters.materials.length > 0 ||
    !!filters.search ||
    !!filters.priceMin ||
    !!filters.priceMax;

  const totalCategories = categoryOptions.reduce((sum, c) => sum + c.count, 0);

  return (
    <aside className="sticky top-24 hidden max-h-[calc(100vh-120px)] space-y-4 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] p-6 lg:block">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Пошук за назвою..."
          className="w-full border-b border-[var(--color-border)] bg-transparent pb-2 pl-6 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
        />
      </div>

      {/* Category */}
      <FilterBlock title="Категорія">
        <div className="space-y-1">
          <label
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors",
              !filters.category
                ? "bg-[var(--color-primary-100)] text-[var(--color-primary)]"
                : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]",
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                  !filters.category
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                    : "border-[var(--color-border)]",
                )}
              >
                {!filters.category && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              Всі вироби
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">({totalCategories})</span>
            <input
              type="radio"
              name="category"
              className="sr-only"
              checked={!filters.category}
              onChange={() => setParam("category", undefined)}
            />
          </label>
          {categoryOptions.map((cat) => {
            const active = filters.category === cat.value;
            return (
              <label
                key={cat.value}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-[var(--color-primary-100)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                      active
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                        : "border-[var(--color-border)]",
                    )}
                  >
                    {active && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {PRODUCT_CATEGORY_LABELS[cat.value as keyof typeof PRODUCT_CATEGORY_LABELS] ?? cat.value}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">({cat.count})</span>
                <input
                  type="radio"
                  name="category"
                  className="sr-only"
                  checked={active}
                  onChange={() => setParam("category", active ? undefined : cat.value)}
                />
              </label>
            );
          })}
        </div>
      </FilterBlock>

      {/* Material */}
      {materialOptions.length > 0 && (
        <FilterBlock title="Матеріал">
          <div className="flex flex-wrap gap-2">
            {materialOptions.map((material) => {
              const active = filters.materials.includes(material);
              return (
                <button
                  key={material}
                  type="button"
                  onClick={() => toggleParamValue("material", material)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
                  )}
                >
                  {material}
                </button>
              );
            })}
          </div>
        </FilterBlock>
      )}

      {/* Style */}
      {styleOptions.length > 0 && (
        <FilterBlock title="Стиль">
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((style) => {
              const active = filters.styles.includes(style);
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleParamValue("style", style)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
                  )}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </FilterBlock>
      )}

      {/* Price */}
      <FilterBlock title="Ціна" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceMin}
            onChange={(e) => handlePriceChange("price_min", e.target.value)}
            placeholder="від"
            min={0}
            className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <span className="text-[var(--color-text-muted)]">—</span>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => handlePriceChange("price_max", e.target.value)}
            placeholder="до"
            min={0}
            className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {priceMin || priceMax
            ? `від ${priceMin || "0"} грн до ${priceMax || "∞"} грн`
            : "Вкажіть діапазон цін"}
        </p>
      </FilterBlock>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
        >
          <RotateCcw size={14} />
          Скинути фільтри
        </button>
      )}
    </aside>
  );
}
