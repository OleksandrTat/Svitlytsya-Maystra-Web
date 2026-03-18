"use client";

import { useRef, useState } from "react";
import {
  evaluatePricingExpression,
  type PricingRuntimeInputs,
} from "@/lib/pricing/expression";

export type VariableToken =
  | {
      kind: "preset";
      key: string;
      label: string;
      value: number;
      unit: string;
    }
  | {
      kind: "input";
      key: string;
      label: string;
      unit: string;
      inputType: "number" | "boolean";
    };

type Props = {
  value: string;
  onChange: (value: string) => void;
  presetVars: VariableToken[];
  inputVars: VariableToken[];
  testValues: PricingRuntimeInputs;
  onTestValueChange: (key: string, value: number | boolean) => void;
  placeholder?: string;
};

const OPERATORS = [
  { label: "(", value: "(" },
  { label: ")", value: ")" },
  { label: "+", value: "+" },
  { label: "-", value: "-" },
  { label: "×", value: "*" },
  { label: "÷", value: "/" },
  { label: "^", value: "**" },
  { label: "%", value: "%" },
];

function isInlineOperator(value: string) {
  return value === "+" || value === "-" || value === "*" || value === "/";
}

export function ExpressionEditor({
  value,
  onChange,
  presetVars,
  inputVars,
  testValues,
  onTestValueChange,
  placeholder,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const previewResult = evaluatePricingExpression(value, {
    presets: presetVars
      .filter((token): token is Extract<VariableToken, { kind: "preset" }> => token.kind === "preset")
      .map((token) => ({
        id: token.key,
        name: token.label,
        category: "material",
        variable_key: token.key,
        unit: token.unit,
        value: token.value,
        currency: "UAH",
        notes: null,
        created_at: "",
        updated_at: "",
      })),
    inputs: testValues,
  });

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const normalized = isInlineOperator(text) ? ` ${text} ` : text;
    const nextValue = `${value.slice(0, start)}${normalized}${value.slice(end)}`;
    onChange(nextValue);

    queueMicrotask(() => {
      const cursor = start + normalized.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleBackspace = () => {
    if (!value) {
      return;
    }

    onChange(value.trimEnd().split(/\s+/).slice(0, -1).join(" "));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          spellCheck={false}
          placeholder={
            placeholder ?? "oak_board * width_m * height_m + carpenter_hour * 8"
          }
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 font-mono text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-300)]"
        />

        {value.trim() ? (
          <div className="absolute right-2 top-2">
            {previewResult !== null ? (
              <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                = {Math.round(previewResult * 100) / 100}
              </span>
            ) : (
              <span className="rounded-lg bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                Помилка
              </span>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {OPERATORS.map((operator) => (
          <button
            key={operator.label}
            type="button"
            onClick={() => insertAtCursor(operator.value)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-100)] hover:text-[var(--color-primary)]"
          >
            {operator.label}
          </button>
        ))}

        <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />

        <button
          type="button"
          onClick={handleBackspace}
          className="rounded-lg border border-[var(--color-border)] bg-white px-2 py-1 text-xs text-[var(--color-text-secondary)] transition hover:border-red-300 hover:text-red-600"
        >
          Backspace
        </button>
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-lg border border-[var(--color-border)] bg-white px-2 py-1 text-xs text-[var(--color-text-secondary)] transition hover:border-red-300 hover:text-red-600"
        >
          Очистити
        </button>
      </div>

      {presetVars.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Змінні з бази
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presetVars.map((token) =>
              token.kind === "preset" ? (
                <button
                  key={token.key}
                  type="button"
                  onClick={() => insertAtCursor(token.key)}
                  title={`${token.label}: ${token.value} ${token.unit}`}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:border-sky-400 hover:bg-sky-100"
                >
                  <span className="font-mono">{token.key}</span>
                </button>
              ) : null,
            )}
          </div>
        </div>
      ) : null}

      {inputVars.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Введення користувача
          </p>
          <div className="flex flex-wrap gap-1.5">
            {inputVars.map((token) =>
              token.kind === "input" ? (
                <button
                  key={token.key}
                  type="button"
                  onClick={() => insertAtCursor(token.key)}
                  title={`${token.label} (${token.unit})`}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:border-violet-400 hover:bg-violet-100"
                >
                  <span className="font-mono">{token.key}</span>
                </button>
              ) : null,
            )}
          </div>
        </div>
      ) : null}

      {inputVars.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className="text-xs font-medium text-[var(--color-primary)] underline underline-offset-2"
          >
            {showPreview ? "Сховати тестовий калькулятор" : "Показати тестовий калькулятор"}
          </button>

          {showPreview ? (
            <div className="mt-2 rounded-xl border border-[var(--color-border)] bg-white p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {inputVars.map((token) =>
                  token.kind === "input" ? (
                    <label key={token.key} className="space-y-1">
                      <span className="text-[10px] text-[var(--color-text-secondary)]">
                        {token.label} ({token.unit})
                      </span>

                      {token.inputType === "boolean" ? (
                        <button
                          type="button"
                          onClick={() =>
                            onTestValueChange(token.key, !(testValues[token.key] === true))
                          }
                          className={`flex h-10 items-center rounded-xl border px-3 text-sm transition ${
                            testValues[token.key] === true
                              ? "border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]"
                              : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {testValues[token.key] === true ? "Так" : "Ні"}
                        </button>
                      ) : (
                        <input
                          type="number"
                          value={
                            typeof testValues[token.key] === "number"
                              ? (testValues[token.key] as number)
                              : ""
                          }
                          onChange={(event) =>
                            onTestValueChange(token.key, Number(event.target.value) || 0)
                          }
                          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-mono"
                        />
                      )}
                    </label>
                  ) : null,
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
