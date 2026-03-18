"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  normalizePricingVariableKey,
  type PricingInputDefinition,
} from "@/lib/pricing/expression";
import type {
  FormulaComponentType,
  PriceFormula,
  PricePreset,
  PricePresetCategory,
  PricingProductType,
} from "@/lib/types";

type ActionResult<T = undefined> = {
  ok: boolean;
  message: string;
  data?: T;
};

type FormulaComponentPayload = {
  id?: string;
  type: FormulaComponentType;
  label: string;
  preset_id?: string | null;
  expression: string;
  condition?: string | null;
  notes?: string | null;
  is_discount?: boolean;
  sort_order: number;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeInputDefinitions(value: unknown): PricingInputDefinition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: PricingInputDefinition[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const key = String(record.key || "").trim();
    if (!key) {
      continue;
    }

    normalized.push({
      key,
      label: String(record.label || key).trim() || key,
      unit: String(record.unit || "").trim(),
      type: record.type === "boolean" ? "boolean" : "number",
      default_value: Number.isFinite(Number(record.default_value)) ? Number(record.default_value) : 0,
      min: Number.isFinite(Number(record.min)) ? Number(record.min) : undefined,
      max: Number.isFinite(Number(record.max)) ? Number(record.max) : undefined,
    });
  }

  return normalized;
}

function normalizeFormulaComponents(value: unknown): FormulaComponentPayload[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: FormulaComponentPayload[] = [];

  value.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return;
    }

    const record = item as Record<string, unknown>;
    const label = String(record.label || "").trim();
    const expression = String(record.expression || "").trim();
    if (!label || !expression) {
      return;
    }

    normalized.push({
      id: String(record.id || "").trim() || undefined,
      type: String(record.type || "material") as FormulaComponentType,
      label,
      preset_id: String(record.preset_id || "").trim() || null,
      expression,
      condition: String(record.condition || "").trim() || null,
      notes: String(record.notes || "").trim() || null,
      is_discount: record.is_discount === true || record.is_discount === "true",
      sort_order: Number.isFinite(Number(record.sort_order)) ? Number(record.sort_order) : index,
    });
  });

  return normalized;
}

async function revalidatePricingProducts(formulaIds?: string[]) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return;
  }

  let query = supabase.from("products").select("slug, formula_id").not("formula_id", "is", null);
  if (formulaIds && formulaIds.length > 0) {
    query = query.in("formula_id", formulaIds);
  }

  const { data } = await query;
  revalidatePath("/products");

  for (const product of data ?? []) {
    if (product.slug) {
      revalidatePath(`/products/${product.slug}`);
    }
  }
}

export async function upsertPricePresetAction(
  formData: FormData,
): Promise<ActionResult<PricePreset>> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "material") as PricePresetCategory;
  const unit = String(formData.get("unit") || "").trim();
  const value = Number(formData.get("value") || 0);
  const currency = String(formData.get("currency") || "UAH").trim().toUpperCase();
  const notes = String(formData.get("notes") || "").trim();
  const variableKey = normalizePricingVariableKey(
    String(formData.get("variable_key") || name),
    `variable_${Date.now()}`,
  );

  if (!name || !unit || Number.isNaN(value) || value < 0) {
    return { ok: false, message: "Please provide valid preset fields." };
  }

  const payload = {
    id: id || randomUUID(),
    name,
    category,
    variable_key: variableKey,
    unit,
    value,
    currency: currency || "UAH",
    notes: notes || null,
  };

  const { data, error } = await supabase
    .from("price_presets")
    .upsert(payload)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "Failed to save price preset." };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/admin/pricing/presets");
  await revalidatePricingProducts();

  return { ok: true, message: "Price preset saved.", data: data as PricePreset };
}

export async function deletePricePresetAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    return { ok: false, message: "Preset id is required." };
  }

  const { error } = await supabase.from("price_presets").delete().eq("id", id);
  if (error) {
    return { ok: false, message: "Failed to delete price preset." };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/admin/pricing/presets");
  await revalidatePricingProducts();

  return { ok: true, message: "Price preset deleted.", data: { id } };
}

export async function upsertPriceFormulaAction(
  formData: FormData,
): Promise<ActionResult<PriceFormula>> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const productType = String(formData.get("product_type") || "door") as PricingProductType;
  const description = String(formData.get("description") || "").trim();
  const inputSchemaRaw = String(formData.get("input_schema") || formData.get("user_inputs") || "[]");
  const hasComponents = formData.has("components");
  const componentsRaw = String(formData.get("components") || "[]");
  const isActive = String(formData.get("is_active") || "true") !== "false";

  if (!name) {
    return { ok: false, message: "Formula name is required." };
  }

  let inputSchema: PricingInputDefinition[] = [];
  try {
    inputSchema = normalizeInputDefinitions(JSON.parse(inputSchemaRaw));
  } catch {
    return { ok: false, message: "Input schema must be valid JSON." };
  }

  let components: FormulaComponentPayload[] = [];
  try {
    components = normalizeFormulaComponents(JSON.parse(componentsRaw));
  } catch {
    return { ok: false, message: "Components must be valid JSON." };
  }

  const formulaId = id || randomUUID();
  const formulaPayload = {
    id: formulaId,
    name,
    product_type: productType,
    description: description || null,
    input_schema: inputSchema,
    user_inputs: inputSchema,
    is_active: isActive,
  };

  const { data: formulaData, error } = await supabase
    .from("price_formulas")
    .upsert(formulaPayload)
    .select("*")
    .maybeSingle();

  if (error || !formulaData) {
    return { ok: false, message: "Failed to save price formula." };
  }

  if (hasComponents) {
    const { data: existingComponents, error: existingError } = await supabase
      .from("formula_components")
      .select("id")
      .eq("formula_id", formulaId);

    if (existingError) {
      return { ok: false, message: "Failed to load existing formula components." };
    }

    const existingIds = (existingComponents ?? []).map((component) => component.id);
    const nextRows = components.map((component, index) => ({
      id: component.id && isUuid(component.id) ? component.id : randomUUID(),
      formula_id: formulaId,
      type: component.type,
      label: component.label,
      preset_id: component.preset_id || null,
      expression: component.expression,
      condition: component.condition || null,
      notes: component.notes || null,
      is_discount: component.is_discount ?? false,
      sort_order: Number.isFinite(component.sort_order) ? component.sort_order : index,
    }));

    const nextIds = new Set(nextRows.map((component) => component.id));
    const idsToDelete = existingIds.filter((componentId) => !nextIds.has(componentId));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("formula_components")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        return { ok: false, message: "Failed to remove old formula components." };
      }
    }

    if (nextRows.length > 0) {
      const { error: componentsError } = await supabase.from("formula_components").upsert(nextRows);
      if (componentsError) {
        return { ok: false, message: "Failed to save formula components." };
      }
    }
  }

  revalidatePath("/admin/pricing");
  revalidatePath(`/admin/pricing/${formulaId}`);
  await revalidatePricingProducts([formulaId]);

  return { ok: true, message: "Price formula saved.", data: formulaData as PriceFormula };
}

export async function addFormulaComponentAction(
  formData: FormData,
): Promise<ActionResult<{ formulaId: string }>> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const formulaId = String(formData.get("formula_id") || "").trim();
  const type = String(formData.get("type") || "material") as FormulaComponentType;
  const label = String(formData.get("label") || "").trim();
  const presetId = String(formData.get("preset_id") || "").trim();
  const expression = String(formData.get("expression") || "").trim();
  const condition = String(formData.get("condition") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const sortOrder = Number(formData.get("sort_order") || 0);
  const isDiscount = String(formData.get("is_discount") || "false") === "true";

  if (!formulaId || !label || !expression) {
    return { ok: false, message: "Formula ID, label and expression are required." };
  }

  const { error } = await supabase.from("formula_components").insert({
    formula_id: formulaId,
    type,
    label,
    preset_id: presetId || null,
    expression,
    condition: condition || null,
    notes: notes || null,
    is_discount: isDiscount,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  });

  if (error) {
    return { ok: false, message: "Failed to add formula component." };
  }

  revalidatePath(`/admin/pricing/${formulaId}`);
  await revalidatePricingProducts([formulaId]);

  return { ok: true, message: "Formula component added.", data: { formulaId } };
}

export async function updatePricePresetFieldAction(params: {
  id: string;
  field: "value" | "unit" | "currency";
  value: string | number;
}): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(params.id || "").trim();
  const field = params.field;

  if (!id || !field) {
    return { ok: false, message: "Preset id and field are required." };
  }

  const payload: Record<string, unknown> = {};

  if (field === "value") {
    const parsed = Number(params.value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, message: "Value must be a non-negative number." };
    }
    payload.value = parsed;
  }

  if (field === "unit") {
    const parsed = String(params.value || "").trim();
    if (!parsed) {
      return { ok: false, message: "Unit is required." };
    }
    payload.unit = parsed;
  }

  if (field === "currency") {
    const parsed = String(params.value || "").trim();
    if (!parsed) {
      return { ok: false, message: "Currency is required." };
    }
    payload.currency = parsed.toUpperCase();
  }

  const { error } = await supabase.from("price_presets").update(payload).eq("id", id);

  if (error) {
    return { ok: false, message: "Failed to update preset field." };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/admin/pricing/presets");
  await revalidatePricingProducts();

  return { ok: true, message: "Preset updated.", data: { id } };
}
