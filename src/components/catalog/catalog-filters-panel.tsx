"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATALOG_MATERIALS, CATALOG_STYLES, PROJECT_CATEGORY_LABELS } from "@/lib/constants";
import type { CatalogFilters, ProjectCategory } from "@/lib/types";

const categoryOptions: Array<{ value: ProjectCategory; label: string }> = [
  { value: "doors", label: PROJECT_CATEGORY_LABELS.doors },
  { value: "furniture", label: PROJECT_CATEGORY_LABELS.furniture },
  { value: "windows", label: PROJECT_CATEGORY_LABELS.windows },
];

function parseCsv(value: string | null) {
  if (!value) {
    return [];
  }
  return value.split(",").filter(Boolean);
}

function updateCsv(values: string[], value: string) {
  if (values.includes(value)) {
    return values.filter((item) => item !== value);
  }

  return [...values, value];
}

type Props = {
  filters: CatalogFilters;
};

export function CatalogFiltersPanel({ filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const setParam = (key: string, value?: string) => {
    const params = new URLSearchParams(currentParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleParamValue = (key: string, value: string) => {
    const values = parseCsv(searchParams.get(key));
    const next = updateCsv(values, value);
    setParam(key, next.length ? next.join(",") : undefined);
  };

  return (
    <aside className="space-y-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Категорія</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParam("category", undefined)}
            className={`rounded-full px-3 py-1 text-sm ${!filters.category ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)]"}`}
          >
            Всі
          </button>
          {categoryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setParam("category", option.value)}
              className={`rounded-full px-3 py-1 text-sm ${filters.category === option.value ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)]"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Стиль</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATALOG_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => toggleParamValue("style", style)}
              className={`rounded-full px-3 py-1 text-sm ${filters.styles.includes(style) ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)]"}`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Матеріал</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATALOG_MATERIALS.map((material) => (
            <button
              key={material}
              type="button"
              onClick={() => toggleParamValue("material", material)}
              className={`rounded-full px-3 py-1 text-sm ${filters.materials.includes(material) ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)]"}`}
            >
              {material}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Статус</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParam("status", undefined)}
            className={`rounded-full px-3 py-1 text-sm ${!filters.status ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)]"}`}
          >
            Всі
          </button>
          <button
            type="button"
            onClick={() => setParam("status", "public")}
            className={`rounded-full px-3 py-1 text-sm ${filters.status === "public" ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)]"}`}
          >
            Публічний
          </button>
          <button
            type="button"
            onClick={() => setParam("status", "nda")}
            className={`rounded-full px-3 py-1 text-sm ${filters.status === "nda" ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)]"}`}
          >
            NDA
          </button>
        </div>
      </div>
    </aside>
  );
}


