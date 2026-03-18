import type { PriceFormula, PricePreset } from "@/lib/types";

export type PricingInputDefinition = {
  key: string;
  label: string;
  unit: string;
  type: "number" | "boolean";
  default_value?: number;
  min?: number;
  max?: number;
};

export type PricingRuntimeValue = number | boolean;
export type PricingRuntimeInputs = Record<string, PricingRuntimeValue>;

const IDENTIFIER_REGEX = /\b[a-z_][a-z0-9_]*\b/gi;
const RESERVED_IDENTIFIERS = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "return",
  "if",
  "else",
  "math",
  "nan",
  "infinity",
  "preset_value",
]);

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "yi",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "yu",
  я: "ya",
  ё: "yo",
  э: "e",
  ы: "y",
  ъ: "",
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceToken(source: string, key: string, replacement: string) {
  return source.replace(new RegExp(`\\b${escapeRegExp(key)}\\b`, "g"), replacement);
}

function normalizeInputDefinition(value: unknown): PricingInputDefinition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const key = String(record.key || "").trim();
  if (!key) {
    return null;
  }

  const type = record.type === "boolean" ? "boolean" : "number";
  const label = String(record.label || key).trim() || key;
  const unit = String(record.unit || (type === "boolean" ? "bool" : "")).trim();
  const defaultValue = Number(record.default_value);
  const min = Number(record.min);
  const max = Number(record.max);

  return {
    key,
    label,
    unit,
    type,
    default_value: Number.isFinite(defaultValue) ? defaultValue : type === "boolean" ? 0 : 0,
    min: Number.isFinite(min) ? min : undefined,
    max: Number.isFinite(max) ? max : undefined,
  };
}

function getFormulaInputSource(formula: Pick<PriceFormula, "user_inputs" | "input_schema"> | null | undefined) {
  if (Array.isArray(formula?.user_inputs)) {
    return formula.user_inputs;
  }

  if (Array.isArray(formula?.input_schema)) {
    return formula.input_schema;
  }

  return [];
}

export function getFormulaUserInputs(
  formula: Pick<PriceFormula, "user_inputs" | "input_schema"> | null | undefined,
): PricingInputDefinition[] {
  return getFormulaInputSource(formula)
    .map((item) => normalizeInputDefinition(item))
    .filter((item): item is PricingInputDefinition => item !== null);
}

export function normalizePricingVariableKey(value: string, fallback = "variable") {
  const latin = Array.from(value.trim().toLowerCase())
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");

  const normalized = latin
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  return normalized || fallback;
}

export function extractPricingIdentifiers(value: string) {
  return Array.from(
    new Set(
      (value.match(IDENTIFIER_REGEX) ?? [])
        .map((identifier) => identifier.toLowerCase())
        .filter((identifier) => !RESERVED_IDENTIFIERS.has(identifier)),
    ),
  );
}

function formatRuntimeValue(value: PricingRuntimeValue | null | undefined) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "0";
}

function applyPricingContext(
  source: string,
  presets: PricePreset[],
  inputs: PricingRuntimeInputs,
  presetValue: number | null | undefined,
) {
  let next = replaceToken(source, "preset_value", String(presetValue ?? 0));

  for (const preset of presets) {
    const variableKey = preset.variable_key?.trim();
    if (!variableKey) {
      continue;
    }

    next = replaceToken(next, variableKey, String(preset.value));
  }

  for (const [key, value] of Object.entries(inputs)) {
    next = replaceToken(next, key, formatRuntimeValue(value));
  }

  return next;
}

export function evaluatePricingExpression(
  expression: string,
  options: {
    presets: PricePreset[];
    inputs?: PricingRuntimeInputs;
    presetValue?: number | null;
  },
) {
  const source = expression.trim();
  if (!source) {
    return null;
  }

  try {
    const prepared = applyPricingContext(
      source,
      options.presets,
      options.inputs ?? {},
      options.presetValue,
    );

    const result = Function(`"use strict"; return (${prepared});`)();
    if (typeof result === "number" && Number.isFinite(result)) {
      return result;
    }

    if (typeof result === "boolean") {
      return result ? 1 : 0;
    }

    return null;
  } catch {
    return null;
  }
}

export function evaluatePricingCondition(
  condition: string | null | undefined,
  options: {
    presets: PricePreset[];
    inputs?: PricingRuntimeInputs;
    presetValue?: number | null;
  },
) {
  if (!condition?.trim()) {
    return true;
  }

  try {
    const prepared = applyPricingContext(
      condition.trim(),
      options.presets,
      options.inputs ?? {},
      options.presetValue,
    );

    const result = Function(`"use strict"; return (${prepared});`)();
    return Boolean(result);
  } catch {
    return false;
  }
}
