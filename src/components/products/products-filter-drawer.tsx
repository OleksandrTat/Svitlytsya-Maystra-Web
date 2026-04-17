"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import type { AttributeOption, CategoryOption, ProductFilters } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

const ATTR_DISPLAY_LIMIT = 8;

type Props = {
  filters: ProductFilters;
  categoryOptions: CategoryOption[];
  styleOptions: AttributeOption[];
  materialOptions: AttributeOption[];
  wishlistCount?: number | null;
};

function parseCsv(value: string | null) {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

function eqIgnoreCase(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}

function includesIgnoreCase(list: string[], value: string) {
  return list.some((item) => eqIgnoreCase(item, value));
}

function toggleIgnoreCase(list: string[], value: string) {
  if (includesIgnoreCase(list, value)) {
    return list.filter((item) => !eqIgnoreCase(item, value));
  }
  return [...list, value];
}

function FilterBlock({
  title,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--color-border)] pb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {title}
          </span>
          {count !== undefined && count > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-semibold text-white">
              {count}
            </span>
          )}
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

function AttributePill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-all",
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm"
          : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "text-[10px] font-semibold tabular-nums",
          active ? "text-white/80" : "text-[var(--color-text-muted)]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ActiveChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-[var(--color-primary)]"
    >
      <span className="max-w-[110px] truncate">{label}</span>
      <X size={12} />
    </button>
  );
}

export function ProductsFilterDrawer({
  filters,
  categoryOptions,
  styleOptions,
  materialOptions,
  wishlistCount = null,
}: Props) {
  const [open, setOpen] = useState(false);
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
      const next = toggleIgnoreCase(values, value);
      setParam(key, next.length ? next.join(",") : undefined);
    },
    [searchParams, setParam],
  );

  // Search
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

  const handleSearchClear = () => {
    setSearchValue("");
    clearTimeout(searchTimerRef.current);
    setParam("search", undefined);
  };

  // Price
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

  const clearPriceRange = () => {
    setPriceMin("");
    setPriceMax("");
    const params = new URLSearchParams(currentParams.toString());
    params.delete("price_min");
    params.delete("price_max");
    params.delete("page");
    const nextSearch = params.toString();
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  };

  // Show-more state
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);

  const visibleMaterials = showAllMaterials
    ? materialOptions
    : materialOptions.slice(0, ATTR_DISPLAY_LIMIT);
  const visibleStyles = showAllStyles
    ? styleOptions
    : styleOptions.slice(0, ATTR_DISPLAY_LIMIT);

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    filters.styles.length +
    filters.materials.length +
    (filters.search ? 1 : 0) +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    (filters.wishlist ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;
  const totalCategories = categoryOptions.reduce((sum, c) => sum + c.count, 0);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 lg:hidden"
      >
        <SlidersHorizontal size={16} />
        Фільтри
        {activeFilterCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--color-primary)]">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-white px-6 pb-4 pt-4">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--color-border)]" />
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">Фільтри</h3>
                    {activeFilterCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[11px] font-semibold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <button type="button" onClick={() => setOpen(false)}>
                    <X size={20} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-6">
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
                    className="w-full border-b border-[var(--color-border)] bg-transparent pb-2 pl-6 pr-6 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                  />
                  {searchValue && (
                    <button
                      type="button"
                      onClick={handleSearchClear}
                      className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--color-text-muted)]"
                      aria-label="Очистити пошук"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Wishlist filter */}
                {wishlistCount !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setParam("wishlist", filters.wishlist ? undefined : "1");
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                      filters.wishlist
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-red-300 hover:text-red-500",
                    )}
                  >
                    <Heart
                      size={15}
                      className={cn(filters.wishlist ? "fill-red-500 text-red-500" : "")}
                    />
                    <span>Вподобані</span>
                    {wishlistCount > 0 && (
                      <span
                        className={cn(
                          "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold",
                          filters.wishlist
                            ? "bg-red-100 text-red-600"
                            : "bg-[var(--color-border)] text-[var(--color-text-muted)]",
                        )}
                      >
                        {wishlistCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Active filters summary */}
                {hasActiveFilters && (
                  <div className="space-y-2 border-b border-[var(--color-border)] pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        Активні ({activeFilterCount})
                      </span>
                      <button
                        type="button"
                        onClick={() => router.push(pathname)}
                        className="text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                      >
                        Очистити
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filters.category && (
                        <ActiveChip
                          label={
                            PRODUCT_CATEGORY_LABELS[
                              filters.category as keyof typeof PRODUCT_CATEGORY_LABELS
                            ] ?? filters.category
                          }
                          onRemove={() => setParam("category", undefined)}
                        />
                      )}
                      {filters.search && (
                        <ActiveChip
                          label={`"${filters.search}"`}
                          onRemove={() => {
                            setSearchValue("");
                            setParam("search", undefined);
                          }}
                        />
                      )}
                      {filters.materials.map((m) => (
                        <ActiveChip
                          key={`m-${m}`}
                          label={m}
                          onRemove={() => toggleParamValue("material", m)}
                        />
                      ))}
                      {filters.styles.map((s) => (
                        <ActiveChip
                          key={`s-${s}`}
                          label={s}
                          onRemove={() => toggleParamValue("style", s)}
                        />
                      ))}
                      {(filters.priceMin || filters.priceMax) && (
                        <ActiveChip
                          label={`${filters.priceMin ?? 0}—${filters.priceMax ?? "∞"} ₴`}
                          onRemove={clearPriceRange}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Category */}
                <FilterBlock title="Категорія">
                  <div className="space-y-0.5">
                    <label
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors",
                        !filters.category
                          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "text-[var(--color-text-primary)]",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border",
                            !filters.category
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                              : "border-[var(--color-border)]",
                          )}
                        >
                          {!filters.category && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        Всі вироби
                      </span>
                      <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                        {totalCategories}
                      </span>
                      <input
                        type="radio"
                        name="category-drawer"
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
                              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                              : "text-[var(--color-text-primary)]",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded border",
                                active
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                                  : "border-[var(--color-border)]",
                              )}
                            >
                              {active && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path
                                    d="M1 4L3.5 6.5L9 1"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            {PRODUCT_CATEGORY_LABELS[
                              cat.value as keyof typeof PRODUCT_CATEGORY_LABELS
                            ] ?? cat.value}
                          </span>
                          <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                            {cat.count}
                          </span>
                          <input
                            type="radio"
                            name="category-drawer"
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
                  <FilterBlock title="Матеріал" count={filters.materials.length}>
                    <div className="flex flex-wrap gap-1.5">
                      {visibleMaterials.map((material) => (
                        <AttributePill
                          key={material.value}
                          label={material.value}
                          count={material.count}
                          active={includesIgnoreCase(filters.materials, material.value)}
                          onClick={() => toggleParamValue("material", material.value)}
                        />
                      ))}
                    </div>
                    {materialOptions.length > ATTR_DISPLAY_LIMIT && (
                      <button
                        type="button"
                        onClick={() => setShowAllMaterials((v) => !v)}
                        className="mt-2.5 text-xs font-medium text-[var(--color-primary)]"
                      >
                        {showAllMaterials
                          ? "Згорнути"
                          : `Показати ще ${materialOptions.length - ATTR_DISPLAY_LIMIT}`}
                      </button>
                    )}
                  </FilterBlock>
                )}

                {/* Style */}
                {styleOptions.length > 0 && (
                  <FilterBlock title="Стиль" count={filters.styles.length}>
                    <div className="flex flex-wrap gap-1.5">
                      {visibleStyles.map((style) => (
                        <AttributePill
                          key={style.value}
                          label={style.value}
                          count={style.count}
                          active={includesIgnoreCase(filters.styles, style.value)}
                          onClick={() => toggleParamValue("style", style.value)}
                        />
                      ))}
                    </div>
                    {styleOptions.length > ATTR_DISPLAY_LIMIT && (
                      <button
                        type="button"
                        onClick={() => setShowAllStyles((v) => !v)}
                        className="mt-2.5 text-xs font-medium text-[var(--color-primary)]"
                      >
                        {showAllStyles
                          ? "Згорнути"
                          : `Показати ще ${styleOptions.length - ATTR_DISPLAY_LIMIT}`}
                      </button>
                    )}
                  </FilterBlock>
                )}

                {/* Price */}
                <FilterBlock title="Ціна" defaultOpen={false}>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={priceMin}
                        onChange={(e) => handlePriceChange("price_min", e.target.value)}
                        placeholder="від"
                        min={0}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 pr-7 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
                        ₴
                      </span>
                    </div>
                    <span className="text-[var(--color-text-muted)]">—</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={priceMax}
                        onChange={(e) => handlePriceChange("price_max", e.target.value)}
                        placeholder="до"
                        min={0}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 pr-7 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
                        ₴
                      </span>
                    </div>
                  </div>
                </FilterBlock>

                {/* Reset */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      router.push(pathname);
                      setOpen(false);
                    }}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                  >
                    <RotateCcw size={14} />
                    Скинути фільтри
                  </button>
                )}
              </div>

              {/* Show results button */}
              <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-white p-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-full bg-[var(--color-primary)] py-3 text-sm font-semibold text-white"
                >
                  Показати результати
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
