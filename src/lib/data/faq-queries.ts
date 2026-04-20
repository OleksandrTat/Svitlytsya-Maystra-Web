import { cache } from "react";
import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getFaqCategoryLabelsWithFallback,
  getFaqCategoryOrderWithFallback,
} from "@/lib/data/categories";
import type { FaqItem } from "@/lib/types";

async function getSupabase() {
  return createSupabaseServiceClient() ?? (await createSupabaseServerClient());
}

export const getPublishedFaqItems = cache(async (): Promise<FaqItem[]> => {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("faq_items")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as FaqItem[];
});

export const getPublishedFaqByCategory = cache(async (): Promise<Record<string, FaqItem[]>> => {
  const items = await getPublishedFaqItems();
  return items.reduce<Record<string, FaqItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});
});

export async function getFaqItemByIdForAdmin(id: string): Promise<FaqItem | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("faq_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as FaqItem | null) ?? null;
}

export async function getAllFaqItemsForAdmin(): Promise<FaqItem[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("faq_items")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as FaqItem[];
}

export type FaqCategoryLabels = Record<string, { uk?: string; en?: string }>;
export type FaqCategoryOrder = string[];

export async function getFaqCategoryOrder(): Promise<FaqCategoryOrder> {
  return getFaqCategoryOrderWithFallback();
}

export async function getFaqCategoryLabels(): Promise<FaqCategoryLabels> {
  return getFaqCategoryLabelsWithFallback();
}
