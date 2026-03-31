"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function addToWishlistAction(productId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Потрібно увійти." };

  await supabase
    .from("wishlist_items")
    .upsert({ user_id: user.id, product_id: productId });
  revalidatePath("/profile/wishlist");
  return { ok: true };
}

export async function removeFromWishlistAction(productId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);
  revalidatePath("/profile/wishlist");
  return { ok: true };
}

export async function getWishlistProductsAction() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("wishlist_items")
    .select("product_id, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((row: Record<string, unknown>) => row.products)
    .filter(Boolean);
}

export async function syncWishlistFromLocalStorage(productIds: string[]) {
  const supabase = await createSupabaseServerClient();
  if (!supabase || !productIds.length) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const rows = productIds.map((product_id) => ({
    user_id: user.id,
    product_id,
  }));
  await supabase
    .from("wishlist_items")
    .upsert(rows, { onConflict: "user_id,product_id" });
  revalidatePath("/profile/wishlist");
}
