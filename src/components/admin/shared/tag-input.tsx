"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Languages, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  translationsEn?: Record<string, string>; // uk → en
  onTranslationChange?: (translations: Record<string, string>) => void;
  autoTranslate?: boolean; // call /api/admin/translate-text for new tags
  placeholder?: string;
  label?: string;
  className?: string;
};

const CHIP_COLORS = [
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
];

function getChipColor(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
  return CHIP_COLORS[Math.abs(hash) % CHIP_COLORS.length]!;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  translationsEn = {},
  onTranslationChange,
  autoTranslate = false,
  placeholder = "Додати...",
  label,
  className,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [pendingTag, setPendingTag] = useState<string | null>(null);
  const [pendingEn, setPendingEn] = useState("");
  const [translating, setTranslating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions.filter(
    item => item.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(item)
  );

  const updateDropPos = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  const openDrop = () => { updateDropPos(); setOpen(true); };

  const addTag = (uk: string, en?: string) => {
    const trimmed = uk.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    if (en && onTranslationChange) {
      onTranslationChange({ ...translationsEn, [trimmed]: en.trim() });
    }
    setInputValue("");
    setPendingTag(null);
    setPendingEn("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const startAdd = async (uk: string) => {
    const trimmed = uk.trim();
    if (!trimmed || value.includes(trimmed)) return;
    if (!onTranslationChange) { addTag(trimmed); return; }
    // Show EN input
    setPendingTag(trimmed);
    setPendingEn(translationsEn[trimmed] ?? "");
    setOpen(false);
    // Auto-translate if requested
    if (autoTranslate && !translationsEn[trimmed]) {
      setTranslating(true);
      try {
        const res = await fetch("/api/admin/translate-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: [trimmed] }),
        });
        const data = await res.json() as { translations?: string[] };
        if (data.translations?.[0]) setPendingEn(data.translations[0]);
      } catch { /* ignore */ }
      finally { setTranslating(false); }
    }
  };

  const removeTag = (tag: string) => onChange(value.filter(item => item !== tag));

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node) && !wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={containerRef} className={cn("space-y-1.5", className)}>
      {label && <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>}

      <div
        ref={wrapperRef}
        className="flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(tag => (
          <span key={tag} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", getChipColor(tag))}>
            <span>{tag}</span>
            {translationsEn[tag] && <span className="text-[10px] opacity-60">/ {translationsEn[tag]}</span>}
            <button type="button" onClick={e => { e.stopPropagation(); removeTag(tag); }} className="rounded-full hover:opacity-70"><X size={10} /></button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); openDrop(); }}
          onFocus={openDrop}
          onKeyDown={e => {
            if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) { e.preventDefault(); void startAdd(inputValue); }
            if (e.key === "Backspace" && !inputValue && value.length > 0) removeTag(value[value.length - 1]!);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
        />
      </div>

      {/* Pending EN translation input */}
      {pendingTag && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-indigo-700">Додаємо: «{pendingTag}»</p>
          <div className="flex items-center gap-2">
            <Languages size={13} className="shrink-0 text-indigo-400" />
            <input
              autoFocus
              value={pendingEn}
              onChange={e => setPendingEn(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(pendingTag, pendingEn); } if (e.key === "Escape") { setPendingTag(null); } }}
              placeholder={translating ? "Перекладаю…" : "EN назва (необов'язково)"}
              disabled={translating}
              className="flex-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
            />
            {translating && <Loader2 size={13} className="animate-spin text-indigo-400" />}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => addTag(pendingTag, pendingEn)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
              Додати
            </button>
            <button type="button" onClick={() => setPendingTag(null)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50">
              Скасувати
            </button>
          </div>
        </div>
      )}

      {/* Portal dropdown */}
      {open && dropPos && (filteredSuggestions.length > 0 || inputValue.trim()) && typeof document !== "undefined" && createPortal(
        <div
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="max-h-52 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white shadow-xl"
        >
          {inputValue.trim() && !suggestions.includes(inputValue.trim()) && !value.includes(inputValue.trim()) && (
            <button type="button" onMouseDown={() => void startAdd(inputValue)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-surface)]">
              <Plus size={14} /> Додати «{inputValue.trim()}»
            </button>
          )}
          {filteredSuggestions.slice(0, 12).map(item => (
            <button key={item} type="button" onMouseDown={() => void startAdd(item)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]">
              <span className={cn("inline-block h-2 w-2 rounded-full border", getChipColor(item).split(" ")[0])} />
              <span>{item}</span>
              {translationsEn[item] && <span className="ml-auto text-xs text-zinc-400">{translationsEn[item]}</span>}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Quick-add chips (only show when not open) */}
      {!open && suggestions.length > 0 && value.length < suggestions.length && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {suggestions.filter(item => !value.includes(item)).slice(0, 8).map(item => (
            <button key={item} type="button" onMouseDown={() => void startAdd(item)}
              className={cn("rounded-full border px-2 py-0.5 text-xs opacity-60 transition-opacity hover:opacity-100", getChipColor(item))}>
              + {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
