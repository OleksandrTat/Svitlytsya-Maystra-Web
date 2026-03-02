"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  parseOrderTemplates,
  parseAdminNotificationSettings,
  type AdminNotificationSettingsPayload,
  type OrderTemplate,
} from "@/lib/admin/config";
import type { Json } from "@/lib/types/database";

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function updateAdminNotificationSettingsAction(
  payload: AdminNotificationSettingsPayload,
): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const normalized = parseAdminNotificationSettings(payload);

  const { error } = await supabase.from("site_settings").upsert({
    key: "admin_notification_settings",
    value: normalized as unknown as Json,
    description: "Admin notifications channels preferences",
  });

  if (error) {
    return { ok: false, message: "Failed to save notification settings." };
  }

  revalidatePath("/admin/settings");
  return { ok: true, message: "Notification settings updated." };
}

export async function updateOrderTemplatesAction(
  templates: OrderTemplate[],
): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const normalized = parseOrderTemplates(templates);

  const { error } = await supabase.from("site_settings").upsert({
    key: "order_templates",
    value: normalized as unknown as Json,
    description: "Admin order templates",
  });

  if (error) {
    return { ok: false, message: "Failed to save order templates." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/settings");

  return { ok: true, message: "Order templates updated." };
}
