"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { DealStage } from "@/lib/types";

async function getSupabase() {
  return createSupabaseServiceClient() ?? (await createSupabaseServerClient());
}

const dealSchema = z.object({
  id: z.string().uuid().optional(),
  contact_id: z.string().uuid(),
  title: z.string().min(1),
  service_type: z.string().optional().nullable(),
  stage: z.enum([
    "lead", "contacted", "quoted", "consulting", "design",
    "approved", "production", "ready", "installation",
    "completed", "lost", "archived",
  ] as const),
  priority: z.enum(["normal", "urgent"]).default("normal"),
  value: z.coerce.number().positive().optional().nullable(),
  expected_date: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
});

export async function upsertDealAction(formData: FormData) {
  await requireAdmin();
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, message: "DB unavailable" };

  const parsed = dealSchema.safeParse({
    id: formData.get("id") || undefined,
    contact_id: formData.get("contact_id"),
    title: formData.get("title"),
    service_type: formData.get("service_type") || null,
    stage: formData.get("stage") || "lead",
    priority: formData.get("priority") || "normal",
    value: formData.get("value") || null,
    expected_date: formData.get("expected_date") || null,
    internal_notes: formData.get("internal_notes") || null,
  });

  if (!parsed.success) return { ok: false, message: "Невалідні дані" };

  const { id, ...rest } = parsed.data;
  const isNew = !id;

  let dealId = id;

  if (isNew) {
    const { data, error } = await supabase.from("deals").insert(rest).select("id").single();
    if (error || !data) return { ok: false, message: error?.message ?? "Помилка" };
    dealId = data.id;
  } else {
    const { error } = await supabase.from("deals").update(rest).eq("id", id);
    if (error) return { ok: false, message: error.message };
  }

  // Update contact last_activity_at
  await supabase
    .from("contacts")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", rest.contact_id);

  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/contacts");
  revalidateTag("admin-counts", "default");
  return { ok: true, message: isNew ? "Угоду створено" : "Угоду оновлено", id: dealId };
}

export async function updateDealStageAction(formData: FormData) {
  await requireAdmin();
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, message: "DB unavailable" };

  const id = formData.get("id") as string;
  const stage = formData.get("stage") as DealStage;
  const comment = (formData.get("comment") as string) || null;

  if (!id || !stage) return { ok: false, message: "ID або статус не вказано" };

  // Get current stage for history
  const { data: current } = await supabase
    .from("deals")
    .select("stage, contact_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("deals")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  // Record history
  await supabase.from("deal_stage_history").insert({
    deal_id: id,
    from_stage: current?.stage ?? null,
    to_stage: stage,
    comment,
  });

  // Update contact activity
  if (current?.contact_id) {
    await supabase
      .from("contacts")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", current.contact_id);
  }

  revalidatePath("/admin/pipeline");
  revalidatePath(`/admin/pipeline/${id}`);
  revalidateTag("admin-counts", "default");
  return { ok: true, message: "Статус оновлено" };
}

export async function deleteDealAction(formData: FormData) {
  await requireAdmin();
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, message: "DB unavailable" };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "ID не вказано" };

  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/contacts");
  revalidateTag("admin-counts", "default");
  return { ok: true, message: "Угоду видалено" };
}

export async function addDealMessageAction(formData: FormData) {
  await requireAdmin();
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, message: "DB unavailable" };

  const deal_id = formData.get("deal_id") as string;
  const content = (formData.get("content") as string)?.trim();
  const channel = (formData.get("channel") as string) || "internal";

  if (!deal_id || !content) return { ok: false, message: "Повідомлення порожнє" };

  const { error } = await supabase.from("deal_messages").insert({
    deal_id,
    content,
    channel,
    sender_type: "admin",
    is_read: true,
  });

  if (error) return { ok: false, message: error.message };

  // Update contact activity
  const { data: deal } = await supabase
    .from("deals")
    .select("contact_id")
    .eq("id", deal_id)
    .single();

  if (deal?.contact_id) {
    await supabase
      .from("contacts")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", deal.contact_id);
  }

  revalidatePath(`/admin/pipeline/${deal_id}`);
  revalidatePath("/admin/messages");
  revalidateTag("admin-counts", "default");
  return { ok: true, message: "Надіслано" };
}
