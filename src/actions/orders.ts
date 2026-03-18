"use server";

import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { OrderStatus } from "@/lib/types";

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function createOrderFromInquiryAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const inquiryId = String(formData.get("inquiry_id") || "");
  const userId = String(formData.get("user_id") || "");
  const expectedDate = String(formData.get("expected_date") || "");
  const internalNotes = String(formData.get("internal_notes") || "");
  const priority = String(formData.get("priority") || "normal");

  if (!inquiryId) {
    return { ok: false, message: "Inquiry ID is required." };
  }

  const { error } = await supabase.from("orders").insert({
    id: randomUUID(),
    inquiry_id: inquiryId,
    user_id: userId || null,
    expected_date: expectedDate || null,
    internal_notes: internalNotes || null,
    priority: priority === "urgent" ? "urgent" : "normal",
    status: "new",
  });

  if (error) {
    return { ok: false, message: "Failed to create order." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/inquiries");

  return { ok: true, message: "Order created." };
}

export async function updateOrderStatusAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const orderId = String(formData.get("order_id") || "");
  const status = String(formData.get("status") || "") as OrderStatus;
  const comment = String(formData.get("comment") || "");
  const isVisibleToClient = String(formData.get("is_visible_to_client") || "true") !== "false";

  if (!orderId || !status) {
    return { ok: false, message: "Order ID and status are required." };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (updateError) {
    return { ok: false, message: "Failed to update order status." };
  }

  if (comment) {
    const { data: historyRow } = await supabase
      .from("order_status_history")
      .select("id")
      .eq("order_id", orderId)
      .eq("to_status", status)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (historyRow?.id) {
      await supabase
        .from("order_status_history")
        .update({ comment, is_visible_to_client: isVisibleToClient })
        .eq("id", historyRow.id);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/profile/orders");
  revalidatePath(`/profile/orders/${orderId}`);
  revalidateTag("admin-counts", "default");

  return { ok: true, message: "Order status updated." };
}

export async function updateOrderProjectAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const orderId = String(formData.get("order_id") || "");
  const projectId = String(formData.get("project_id") || "").trim();

  if (!orderId) {
    return { ok: false, message: "Order ID is required." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ project_id: projectId || null })
    .eq("id", orderId);

  if (error) {
    return { ok: false, message: "Failed to update linked project." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/admin/products");
  revalidatePath("/profile/orders");
  revalidatePath(`/profile/orders/${orderId}`);
  revalidateTag("admin-counts", "default");

  return { ok: true, message: "Linked project updated." };
}

export async function addAdminOrderMessageAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const orderId = String(formData.get("order_id") || "");
  const content = String(formData.get("content") || "").trim();
  const senderId = String(formData.get("sender_id") || "");

  if (!orderId || !content) {
    return { ok: false, message: "Order ID and message are required." };
  }

  const { error } = await supabase.from("order_messages").insert({
    order_id: orderId,
    sender_type: "admin",
    sender_id: senderId || null,
    content,
  });

  if (error) {
    return { ok: false, message: "Failed to send message." };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/profile/orders/${orderId}/messages`);
  revalidateTag("admin-counts", "default");

  return { ok: true, message: "Message sent." };
}

export async function addClientOrderMessageAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You need to be signed in." };
  }

  const orderId = String(formData.get("order_id") || "");
  const content = String(formData.get("content") || "").trim();

  if (!orderId || !content) {
    return { ok: false, message: "Order ID and message are required." };
  }

  const { error } = await supabase.from("order_messages").insert({
    order_id: orderId,
    sender_type: "client",
    sender_id: user.id,
    content,
  });

  if (error) {
    return { ok: false, message: "Failed to send message." };
  }

  revalidatePath(`/profile/orders/${orderId}`);
  revalidatePath(`/profile/orders/${orderId}/messages`);

  return { ok: true, message: "Message sent." };
}
