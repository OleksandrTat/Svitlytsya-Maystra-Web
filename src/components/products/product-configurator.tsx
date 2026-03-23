"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfigOption = {
  value: string;
  label: string;
  description?: string;
  preview?: string;
  priceModifier?: number;
};

export type ConfigStep = {
  id: string;
  label: string;
  options: ConfigOption[];
  allowCustom?: boolean;
};

type ConfiguratorProps = {
  productSlug: string;
  productTitle: string;
  category: string;
  priceFrom: number | null;
  steps: ConfigStep[];
  onComplete: (config: Record<string, string>) => void;
};

export const CONFIGURATOR_STEPS: Record<string, ConfigStep[]> = {
  doors: [
    {
      id: "wood",
      label: "Деревина",
      options: [
        { value: "oak", label: "Дуб", description: "Міцна, довговічна, класика" },
        { value: "ash", label: "Ясен", description: "Виразний малюнок, світліший" },
        { value: "pine", label: "Сосна", description: "Доступно, природний вигляд" },
        { value: "other", label: "Інше", description: "Обговоримо варіант" },
      ],
      allowCustom: true,
    },
    {
      id: "finish",
      label: "Покриття",
      options: [
        { value: "natural_oil", label: "Натуральна олія", description: "Підкреслює текстуру" },
        { value: "lacquer", label: "Лак", description: "Глянцевий захист" },
        { value: "wax", label: "Віск", description: "Матовий, живий вигляд" },
        { value: "paint", label: "Фарба", description: "Будь-який колір RAL" },
      ],
      allowCustom: true,
    },
    {
      id: "hardware",
      label: "Фурнітура",
      options: [
        { value: "chrome", label: "Хром", description: "Сучасна класика" },
        { value: "brass", label: "Латунь", description: "Тепло, ретро" },
        { value: "black", label: "Чорний матовий", description: "Мінімалізм" },
        { value: "discuss", label: "Обговоримо", description: "Підберемо разом" },
      ],
      allowCustom: true,
    },
    {
      id: "size",
      label: "Розміри",
      options: [
        { value: "600x2000", label: "600 × 2000 мм", description: "Стандарт внутрішніх" },
        { value: "700x2000", label: "700 × 2000 мм", description: "Найпопулярніший" },
        { value: "800x2000", label: "800 × 2000 мм", description: "Просторий прохід" },
        { value: "900x2100", label: "900 × 2100 мм", description: "Вхідні двері" },
        { value: "custom", label: "Нестандартний", description: "Введіть свої розміри" },
      ],
      allowCustom: true,
    },
  ],
  furniture: [
    {
      id: "material",
      label: "Матеріал",
      options: [
        { value: "oak_solid", label: "Масив дуба" },
        { value: "mdf_veneer", label: "МДФ + шпон" },
        { value: "plywood", label: "Фанера" },
        { value: "discuss", label: "Обговоримо" },
      ],
      allowCustom: true,
    },
    {
      id: "style",
      label: "Стиль",
      options: [
        { value: "classic", label: "Класика" },
        { value: "minimalism", label: "Мінімалізм" },
        { value: "loft", label: "Лофт" },
        { value: "scandinavian", label: "Скандинавський" },
      ],
    },
    {
      id: "color",
      label: "Колір",
      options: [
        { value: "natural", label: "Натуральний" },
        { value: "walnut", label: "Горіх" },
        { value: "white", label: "Білий" },
        { value: "custom", label: "Індивідуальний" },
      ],
      allowCustom: true,
    },
    {
      id: "size",
      label: "Розміри",
      options: [
        { value: "small", label: "Маленький", description: "до 1 м" },
        { value: "medium", label: "Середній", description: "1–2 м" },
        { value: "large", label: "Великий", description: "2+ м" },
        { value: "custom", label: "Нестандартний" },
      ],
      allowCustom: true,
    },
  ],
  windows: [
    {
      id: "profile",
      label: "Профіль",
      options: [
        { value: "pvc", label: "ПВХ", description: "Практично, доступно" },
        { value: "aluminum", label: "Алюміній", description: "Тонкий, сучасний" },
        { value: "wood", label: "Дерево", description: "Тепло, преміум" },
      ],
    },
    {
      id: "glazing",
      label: "Склопакет",
      options: [
        { value: "single", label: "Однокамерний", description: "Базовий варіант" },
        { value: "double", label: "Двокамерний", description: "Стандарт" },
        { value: "triple", label: "Трикамерний", description: "Максимальне утеплення" },
      ],
    },
    {
      id: "color",
      label: "Колір",
      options: [
        { value: "white", label: "Білий" },
        { value: "anthracite", label: "Антрацит" },
        { value: "woodgrain", label: "Під дерево" },
        { value: "custom", label: "Індивідуальний" },
      ],
      allowCustom: true,
    },
    {
      id: "size",
      label: "Розміри",
      options: [
        { value: "600x1200", label: "600 × 1200 мм" },
        { value: "900x1200", label: "900 × 1200 мм" },
        { value: "1200x1400", label: "1200 × 1400 мм" },
        { value: "custom", label: "Нестандартний" },
      ],
      allowCustom: true,
    },
  ],
};

const CUSTOM_TRIGGER_VALUES = new Set(["custom", "other", "discuss"]);

export function ProductConfigurator({
  productSlug,
  productTitle,
  category,
  priceFrom,
  steps,
  onComplete,
}: ConfiguratorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({});

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = useMemo(() => ((currentStep + 1) / steps.length) * 100, [currentStep, steps.length]);
  const currentValue = selections[step?.id ?? ""];

  const select = (stepId: string, value: string) => {
    setSelections((previous) => ({ ...previous, [stepId]: value }));
    setShowCustomInput((previous) => ({
      ...previous,
      [stepId]: CUSTOM_TRIGGER_VALUES.has(value),
    }));
  };

  const next = () => {
    if (!currentValue || !step) {
      return;
    }

    if (isLastStep) {
      const finalConfig: Record<string, string> = {};

      for (const configStep of steps) {
        const value = selections[configStep.id];
        if (!value) {
          continue;
        }

        if (CUSTOM_TRIGGER_VALUES.has(value) && customValues[configStep.id]?.trim()) {
          finalConfig[configStep.id] = customValues[configStep.id]!.trim();
        } else {
          finalConfig[configStep.id] = value;
        }
      }

      onComplete(finalConfig);
      return;
    }

    setCurrentStep((previous) => previous + 1);
  };

  const back = () => setCurrentStep((previous) => Math.max(0, previous - 1));

  const reset = () => {
    setCurrentStep(0);
    setSelections({});
    setCustomValues({});
    setShowCustomInput({});
  };

  if (!step) {
    return null;
  }

  return (
    <div
      data-product-slug={productSlug}
      data-product-category={category}
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white"
    >
      <div className="relative h-1 bg-[var(--color-border)]">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[var(--color-primary)]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {productTitle}
            {priceFrom ? ` · від ${priceFrom.toLocaleString("uk-UA")} грн` : ""}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Крок {currentStep + 1} з {steps.length}
          </p>
          <p className="text-base font-semibold text-[var(--color-text-primary)]">{step.label}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
        >
          <RotateCcw size={12} />
          Скинути
        </button>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="grid gap-2 sm:grid-cols-2"
          >
            {step.options.map((option) => {
              const isSelected = currentValue === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => select(step.id, option.value)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-100)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                        : "border-[var(--color-border)]",
                    )}
                  >
                    {isSelected ? <Check size={10} className="text-white" /> : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {option.label}
                    </p>
                    {option.description ? (
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        {option.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {step.allowCustom && showCustomInput[step.id] ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-3"
          >
            <input
              value={customValues[step.id] ?? ""}
              onChange={(event) =>
                setCustomValues((previous) => ({
                  ...previous,
                  [step.id]: event.target.value,
                }))
              }
              placeholder="Введіть ваш варіант..."
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
            />
          </motion.div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] px-5 py-4">
        <button
          type="button"
          onClick={back}
          disabled={currentStep === 0}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-40"
        >
          Назад
        </button>

        <button
          type="button"
          onClick={next}
          disabled={!currentValue}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {isLastStep ? "Сформувати заявку" : "Далі"}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
