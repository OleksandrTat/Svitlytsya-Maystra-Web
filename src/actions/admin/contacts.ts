"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

async function getSupabase() {
  return createSupabaseServiceClient() ?? (await createSupabaseServerClient());
}

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  source: z.string().default("manual"),
  notes: z.string().optional().nullable(),
});

export async function upsertContactAction(formData: FormData) {
  await requireAdmin();
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, message: "DB unavailable" };

  const parsed = contactSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    source: formData.get("source") || "manual",
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) return { ok: false, message: "Невалідні дані" };

  const { id, ...rest } = parsed.data;
  const payload = { ...rest, last_activity_at: new Date().toISOString() };

  const { error } = id
    ? await supabase.from("contacts").update(payload).eq("id", id)
    : await supabase.from("contacts").insert(payload);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/contacts");
  revalidateTag("admin-counts", "default");
  return { ok: true, message: id ? "Контакт оновлено" : "Контакт створено" };
}

export async function deleteContactAction(formData: FormData) {
  await requireAdmin();
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, message: "DB unavailable" };

  const id = formData.get("id") as string;
  if (!id) return { ok: false, message: "ID не вказано" };

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/contacts");
  revalidateTag("admin-counts", "default");
  return { ok: true, message: "Контакт видалено" };
}
