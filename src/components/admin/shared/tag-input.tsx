"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
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
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  return CHIP_COLORS[Math.abs(hash) % CHIP_COLORS.length]!;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Додати...",
  label,
  className,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions.filter((item) => {
    return item.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(item);
  });

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) {
      return;
    }

    onChange([...value, trimmed]);
    setInputValue("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
  };

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
    <div ref={containerRef} className={cn("space-y-1.5", className)}>
      {label ? (
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
      ) : null}

      <div
        className="flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              getChipColor(tag),
            )}
          >
            {tag}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeTag(tag);
              }}
              className="rounded-full hover:opacity-70"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              if (inputValue.trim()) {
                addTag(inputValue);
              }
            }

            if (event.key === "Backspace" && !inputValue && value.length > 0) {
              removeTag(value[value.length - 1]!);
            }

            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
        />
      </div>

      {open && (filteredSuggestions.length > 0 || inputValue.trim()) ? (
        <div className="absolute z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white shadow-lg">
          {inputValue.trim() &&
          !suggestions.includes(inputValue.trim()) &&
          !value.includes(inputValue.trim()) ? (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-surface)]"
            >
              <Plus size={14} />
              Додати «{inputValue.trim()}»
            </button>
          ) : null}

          {filteredSuggestions.slice(0, 12).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => addTag(item)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            >
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full border",
                  getChipColor(item).split(" ")[0],
                )}
              />
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {suggestions.length > 0 && value.length < suggestions.length ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {suggestions
            .filter((item) => !value.includes(item))
            .slice(0, 8)
            .map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => addTag(item)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs opacity-60 transition-opacity hover:opacity-100",
                  getChipColor(item),
                )}
              >
                + {item}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
