"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { ProductType } from "@/lib/types";

export async function saveConfigurationAction(params: {
  productType: ProductType;
  configuration: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
  name?: string;
}) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false as const, id: null };
  }

  const { data, error } = await supabase
    .from("saved_configurations")
    .insert({
      product_type: params.productType,
      configuration: params.configuration,
      session_id: params.sessionId ?? null,
      user_id: params.userId ?? null,
      name: params.name ?? null,
    })
    .select("id")
    .maybeSingle();

  return {
    ok: !error,
    id: data?.id ?? null,
  };
}
