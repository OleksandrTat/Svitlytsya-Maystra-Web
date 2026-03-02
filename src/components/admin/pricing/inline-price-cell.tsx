"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePricePresetFieldAction } from "@/actions/pricing";

type EditableField = "value" | "unit" | "currency";

export function InlinePriceCell({
  id,
  field,
  value,
  inputType = "text",
}: {
  id: string;
  field: EditableField;
  value: string | number;
  inputType?: "text" | "number";
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState<string>(String(value));
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const save = () => {
    setEditing(false);

    const nextValue = inputType === "number" ? String(Number(localValue)) : localValue.trim();
    const prevValue = String(value);

    if (nextValue === prevValue || !nextValue) {
      setLocalValue(prevValue);
      return;
    }

    startTransition(() => {
      toast.promise(
        updatePricePresetFieldAction({
          id,
          field,
          value: inputType === "number" ? Number(nextValue) : nextValue,
        }),
        {
          loading: "Зберігаємо...",
          success: (result) => {
            if (!result.ok) {
              throw new Error(result.message);
            }
            return "Значення оновлено.";
          },
          error: "Не вдалося оновити значення.",
        },
      );
    });
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={inputType}
        value={localValue}
        min={inputType === "number" ? 0 : undefined}
        step={inputType === "number" ? "0.01" : undefined}
        onChange={(event) => setLocalValue(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
            const next =
              event.currentTarget
                .closest("tr")
                ?.nextElementSibling?.querySelector<HTMLElement>("[data-editable]");
            next?.click();
          }
          if (event.key === "Escape") {
            setLocalValue(String(value));
            setEditing(false);
          }
          if (event.key === "Tab") {
            save();
          }
        }}
        autoFocus
        className="w-full rounded border-2 border-[var(--color-primary-500)] bg-[var(--color-primary-100)] px-2 py-1 text-right text-sm text-[var(--color-text-primary)] outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      data-editable
      onClick={() => setEditing(true)}
      className={`w-full rounded px-2 py-1 text-right text-sm transition hover:bg-[var(--color-primary-100)] hover:text-[var(--color-primary)] ${
        pending ? "opacity-50" : ""
      }`}
    >
      {field === "value" ? Number(localValue).toLocaleString("uk-UA") : localValue}
    </button>
  );
}
