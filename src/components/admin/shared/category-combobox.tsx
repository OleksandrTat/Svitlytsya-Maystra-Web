"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Languages, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryLabels = Record<string, { uk?: string; en?: string }>;

type Props = {
  value: string;
  onChange: (value: string) => void;
  allCategories: string[];
  labels?: CategoryLabels; // existing labels from DB
  onLabelsChange?: (labels: CategoryLabels) => void;
  name?: string; // hidden input name
};

const FALLBACK_COLORS = [
  "bg-sky-100 text-sky-700", "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700", "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700", "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700",
];

function getCatColor(cat: string, all: string[]) {
  const idx = all.indexOf(cat);
  return FALLBACK_COLORS[(idx >= 0 ? idx : Math.abs(cat.charCodeAt(0))) % FALLBACK_COLORS.length]!;
}

export function CategoryCombobox({
  value,
  onChange,
  allCategories,
  labels = {},
  onLabelsChange,
  name = "category",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showLabels, setShowLabels] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getLabel = (cat: string) => labels[cat]?.uk ?? cat;
  const getEnLabel = (cat: string) => labels[cat]?.en ?? "";

  const suggestions = allCategories.filter(c => {
    if (!query) return true;
    return c.toLowerCase().includes(query.toLowerCase()) || getLabel(c).toLowerCase().includes(query.toLowerCase());
  });

  const updateDropPos = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  const openDrop = () => { updateDropPos(); setOpen(true); };

  const select = (cat: string) => { onChange(cat); setQuery(""); setOpen(false); };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = () => { if (open) updateDropPos(); };
    window.addEventListener("scroll", h, true);
    window.addEventListener("resize", h);
    return () => { window.removeEventListener("scroll", h, true); window.removeEventListener("resize", h); };
  }, [open]);

  const color = value ? getCatColor(value, allCategories) : "bg-zinc-100 text-zinc-500";
  const displayLabel = value ? getLabel(value) : "Вибрати...";

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      {onLabelsChange && (
        <>
          <input type="hidden" name="category_label_uk" value={labels[value]?.uk ?? ""} />
          <input type="hidden" name="category_label_en" value={labels[value]?.en ?? ""} />
        </>
      )}

      <div ref={wrapperRef}>
        {/* Trigger */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition cursor-pointer",
            open ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" : "border-zinc-200 bg-white",
          )}
          onClick={openDrop}
        >
          {!open ? (
            <div className="flex flex-1 items-center gap-1.5">
              {value && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", color)}>{displayLabel}</span>}
              {value && getEnLabel(value) && <span className="text-xs text-zinc-400">/ {getEnLabel(value)}</span>}
              {!value && <span className="text-sm text-zinc-400">Вибрати або написати...</span>}
              <ChevronDown className="ml-auto h-3.5 w-3.5 text-zinc-400" />
            </div>
          ) : (
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="Пошук або нова категорія..."
              value={query}
              onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
              onFocus={openDrop}
              onKeyDown={e => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter") { e.preventDefault(); if (query) { select(query); } }
              }}
              className="flex-1 bg-transparent outline-none placeholder:text-zinc-400 text-sm"
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>

        {/* UK/EN label editor */}
        {onLabelsChange && value && (
          <button
            type="button"
            onClick={() => setShowLabels(v => !v)}
            className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--color-primary)] hover:underline"
          >
            <Languages className="h-3 w-3" />
            {showLabels ? "Приховати назви" : "Задати назви (uk/en)"}
          </button>
        )}
        {onLabelsChange && showLabels && value && (
          <div className="mt-2 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-zinc-500">Назва 🇺🇦</label>
              <input
                type="text"
                value={labels[value]?.uk ?? ""}
                onChange={e => onLabelsChange({ ...labels, [value]: { ...labels[value], uk: e.target.value } })}
                placeholder="напр. Монтаж"
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-zinc-500">Label 🇬🇧</label>
              <input
                type="text"
                value={labels[value]?.en ?? ""}
                onChange={e => onLabelsChange({ ...labels, [value]: { ...labels[value], en: e.target.value } })}
                placeholder="e.g. Installation"
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Portal dropdown */}
      {open && dropPos && typeof document !== "undefined" && createPortal(
        <div
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="max-h-52 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl"
        >
          {suggestions.map(cat => (
            <button key={cat} type="button" onMouseDown={() => select(cat)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-zinc-50">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0", getCatColor(cat, allCategories))}>{getLabel(cat)}</span>
              {getEnLabel(cat) && <span className="text-xs text-zinc-400">{getEnLabel(cat)}</span>}
              {!getEnLabel(cat) && <span className="text-xs text-zinc-300">{cat}</span>}
            </button>
          ))}
          {query && !allCategories.includes(query) && (
            <button type="button" onMouseDown={() => select(query)}
              className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2.5 text-left text-sm text-[var(--color-primary)] hover:bg-zinc-50">
              <Plus className="h-3.5 w-3.5" /> Створити «{query}»
            </button>
          )}
          {suggestions.length === 0 && !query && (
            <div className="px-3 py-2.5 text-sm text-zinc-400">Почніть вводити назву категорії</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
