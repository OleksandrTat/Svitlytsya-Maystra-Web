import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  type SupabaseDataClient,
} from "@/lib/supabase/server";
import type { FormulaComponent } from "@/lib/types";

export async function getFormulaComponentsForProduct(
  formulaId: string,
  supabaseClient?: SupabaseDataClient | null,
): Promise<FormulaComponent[]> {
  if (!formulaId) {
    return [];
  }

  const supabase =
    supabaseClient ?? createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("formula_components")
    .select("*")
    .eq("formula_id", formulaId)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as FormulaComponent[];
}
