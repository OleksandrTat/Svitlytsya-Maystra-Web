"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { FormulaComponentType, PricePresetCategory, PricingProductType } from "@/lib/types";

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function upsertPricePresetAction(formData: FormData): Promise<ActionResult> {
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
  const currency = String(formData.get("currency") || "UAH");
  const notes = String(formData.get("notes") || "");

  if (!name || !unit || Number.isNaN(value) || value < 0) {
    return { ok: false, message: "Please provide valid preset fields." };
  }

  const { error } = await supabase.from("price_presets").upsert({
    id: id || randomUUID(),
    name,
    category,
    unit,
    value,
    currency: currency || "UAH",
    notes: notes || null,
  });

  if (error) {
    return { ok: false, message: "Failed to save price preset." };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/admin/pricing/presets");

  return { ok: true, message: "Price preset saved." };
}

export async function upsertPriceFormulaAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const productType = String(formData.get("product_type") || "door") as PricingProductType;
  const description = String(formData.get("description") || "");
  const inputSchemaRaw = String(formData.get("input_schema") || "[]");
  const isActive = String(formData.get("is_active") || "true") !== "false";

  if (!name) {
    return { ok: false, message: "Formula name is required." };
  }

  let inputSchema: unknown = [];
  try {
    inputSchema = JSON.parse(inputSchemaRaw);
  } catch {
    return { ok: false, message: "Input schema must be valid JSON." };
  }

  const { error } = await supabase.from("price_formulas").upsert({
    id: id || randomUUID(),
    name,
    product_type: productType,
    description: description || null,
    input_schema: inputSchema,
    is_active: isActive,
  });

  if (error) {
    return { ok: false, message: "Failed to save price formula." };
  }

  revalidatePath("/admin/pricing");

  return { ok: true, message: "Price formula saved." };
}

export async function addFormulaComponentAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const formulaId = String(formData.get("formula_id") || "");
  const type = String(formData.get("type") || "material") as FormulaComponentType;
  const label = String(formData.get("label") || "").trim();
  const presetId = String(formData.get("preset_id") || "");
  const expression = String(formData.get("expression") || "").trim();
  const condition = String(formData.get("condition") || "");
  const sortOrder = Number(formData.get("sort_order") || 0);

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
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  });

  if (error) {
    return { ok: false, message: "Failed to add formula component." };
  }

  revalidatePath(`/admin/pricing/${formulaId}`);

  return { ok: true, message: "Formula component added." };
}
