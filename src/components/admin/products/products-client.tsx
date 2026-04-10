"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Package, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction } from "@/actions/admin/products";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import type { PriceFormula, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  formulas?: PriceFormula[];
};

const STATUS_CHIP: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  draft: "bg-amber-100 text-amber-800",
  archived: "bg-zinc-100 text-zinc-500",
};

function getPriorityValue(product: Product) {
  const candidate = Number((product as Product & { priority?: number }).priority);
  if (Number.isFinite(candidate) && candidate >= 1 && candidate <= 10) {
    return candidate;
  }

  const fallback = Number(product.sort_order);
  if (Number.isFinite(fallback) && fallback >= 1 && fallback <= 10) {
    return fallback;
  }

  return 5;
}

function PriorityDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Пріоритет ${value}/10`}>
      {Array.from({ length: 10 }, (_, index) => index + 1).map((segment) => (
        <div
          key={segment}
          className={cn(
            "h-1.5 w-1.5 rounded-full transition",
            segment <= value
              ? value <= 3
                ? "bg-emerald-400"
                : value <= 6
                  ? "bg-amber-400"
                  : value <= 8
                    ? "bg-orange-500"
                    : "bg-red-500"
              : "bg-[var(--color-border)]",
          )}
        />
      ))}
      <span className="ml-1 text-[10px] text-[var(--color-text-secondary)]">{value}</span>
    </div>
  );
}

export default function AdminProductsClient({
  products: initialProducts,
}: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const filteredProducts = products.filter((product) => {
    const normalizedQuery = query.toLowerCase();
    if (
      normalizedQuery &&
      !product.title.toLowerCase().includes(normalizedQuery) &&
      !product.slug.includes(normalizedQuery)
    ) {
      return false;
    }

    if (categoryFilter && product.category !== categoryFilter) {
      return false;
    }

    if (statusFilter && product.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const handleDelete = async (product: Product) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast.warning(`Видалити «${product.title}»?`, {
        duration: 6000,
        action: { label: "Видалити", onClick: () => resolve(true) },
        cancel: { label: "Скасувати", onClick: () => resolve(false) },
      });
    });

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    const formData = new FormData();
    formData.set("id", product.id);
    const result = await deleteProductAction(formData);

    if (result.ok) {
      toast.success(result.message);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } else {
      toast.error(result.message);
    }

    setDeletingId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2">
            <Search size={14} className="text-[var(--color-text-secondary)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Пошук за назвою або slug..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </div>
        </div>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <option value="">Усі категорії</option>
          {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <option value="">Усі статуси</option>
          {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => router.push("/admin/products/new")}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
        >
          <Plus size={16} />
          Новий продукт
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(PRODUCT_CATEGORY_LABELS).map(([category, label]) => {
          const count = products.filter((product) => product.category === category).length;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category === categoryFilter ? "" : category)}
              className={cn(
                "rounded-2xl border p-3 text-left transition",
                category === categoryFilter
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-100)]"
                  : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-300)]",
              )}
            >
              <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{count}</p>
            </button>
          );
        })}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] py-16">
          <Package size={32} className="text-[var(--color-border)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            {query || categoryFilter || statusFilter
              ? "За фільтрами нічого не знайдено"
              : "Ще немає продуктів"}
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin/products/new")}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={14} />
            Створити перший продукт
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const priority = getPriorityValue(product);
            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:shadow-md"
              >
                <div className="relative h-44 overflow-hidden bg-[var(--color-surface)]">
                  {product.cover_image ? (
                    <Image
                      src={product.cover_image}
                      alt={product.title}
                      fill
                      className="object-cover transition group-hover:scale-[1.02]"
                      sizes="400px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Tag size={32} className="text-[var(--color-border)]" />
                    </div>
                  )}

                  <div className="absolute left-2 top-2 flex gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        STATUS_CHIP[product.status] ?? "bg-zinc-100 text-zinc-500",
                      )}
                    >
                      {PRODUCT_STATUS_LABELS[product.status]}
                    </span>
                    {product.is_featured ? (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                        Featured
                      </span>
                    ) : null}
                    {(product as { title_en?: string | null }).title_en ? (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        EN
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2.5 p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="leading-tight font-semibold text-[var(--color-text-primary)]">
                        {product.title}
                      </p>
                      <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">
                        {PRODUCT_CATEGORY_LABELS[
                          product.category as keyof typeof PRODUCT_CATEGORY_LABELS
                        ] ?? product.category}
                      </span>
                    </div>
                    {product.short_description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                        {product.short_description}
                      </p>
                    ) : null}
                  </div>

                  {product.materials.length > 0 || product.style.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {[...product.style.slice(0, 2), ...product.materials.slice(0, 2)].map(
                        (tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]"
                          >
                            {tag}
                          </span>
                        ),
                      )}
                    </div>
                  ) : null}

                  <PriorityDots value={priority} />

                  <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2.5">
                    <p className="text-sm font-semibold text-[var(--color-primary)]">
                      {product.price_from
                        ? `від ${product.price_from.toLocaleString("uk-UA")} грн`
                        : "Ціна за запитом"}
                    </p>
                    <div className="flex gap-1">
                      <Link
                        href={`/products/${product.slug}`}
                        className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        title="Відкрити сторінку продукту"
                      >
                        <ExternalLink size={13} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                        className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] transition hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}
