"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, ChevronDown, Search, X } from "lucide-react";
import type { PriceFormula } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  formulas: PriceFormula[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
};

export function FormulaPicker({
  formulas,
  value,
  onChange,
  placeholder = "Без формули",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedFormula = formulas.find((formula) => formula.id === value) ?? null;
  const filteredFormulas = formulas.filter((formula) => {
    const normalizedQuery = query.toLowerCase();
    return (
      formula.name.toLowerCase().includes(normalizedQuery) ||
      formula.product_type.toLowerCase().includes(normalizedQuery)
    );
  });

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition",
          open
            ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-300)]"
            : "border-[var(--color-border)] hover:border-[var(--color-primary-500)]",
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Calculator size={14} className="shrink-0 text-[var(--color-text-secondary)]" />
          {selectedFormula ? (
            <span className="font-medium text-[var(--color-text-primary)]">
              {selectedFormula.name}
            </span>
          ) : (
            <span className="text-[var(--color-text-secondary)]">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1">
          {selectedFormula ? (
            <span
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
              className="rounded-full p-0.5 hover:bg-[var(--color-surface)]"
            >
              <X size={12} className="text-[var(--color-text-secondary)]" />
            </span>
          ) : null}

          <ChevronDown
            size={14}
            className={cn(
              "text-[var(--color-text-secondary)] transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xl"
          >
            <div className="border-b border-[var(--color-border)] p-2">
              <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5">
                <Search size={13} className="text-[var(--color-text-secondary)]" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setOpen(false);
                    }
                  }}
                  placeholder="Пошук формули..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery("")}>
                    <X size={12} className="text-[var(--color-text-secondary)]" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-sm transition hover:bg-[var(--color-surface)]",
                  !value && "bg-[var(--color-primary-100)] font-medium text-[var(--color-primary)]",
                )}
              >
                <span className="text-[var(--color-text-secondary)]">Без формули</span>
              </button>

              {filteredFormulas.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-[var(--color-text-secondary)]">
                  Формул не знайдено
                </p>
              ) : null}

              {filteredFormulas.map((formula) => (
                <button
                  key={formula.id}
                  type="button"
                  onClick={() => {
                    onChange(formula.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-[var(--color-surface)]",
                    value === formula.id && "bg-[var(--color-primary-100)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        value === formula.id
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-text-primary)]",
                      )}
                    >
                      {formula.name}
                    </span>
                    <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">
                      {formula.product_type}
                    </span>
                  </div>
                  {formula.description ? (
                    <p className="line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                      {formula.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
