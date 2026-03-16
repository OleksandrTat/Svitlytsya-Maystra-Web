"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { InvoiceStatus, PaymentMethod } from "@/lib/types";

type ActionResult = { ok: boolean; message: string };

export async function createInvoiceFromOrderAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  const orderId = String(formData.get("order_id") || "");
  const total = Number(formData.get("total") || 0);
  const dueDate = String(formData.get("due_date") || "");
  const notes = String(formData.get("notes") || "");

  if (!orderId || total <= 0) {
    return { ok: false, message: "order_id та total обов'язкові." };
  }

  const { error } = await supabase.from("invoices").insert({
    order_id: orderId,
    total,
    due_date: dueDate || null,
    notes: notes || null,
    status: "draft",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Рахунок створено." };
}

export async function updateInvoiceStatusAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as InvoiceStatus;
  const orderId = String(formData.get("order_id") || "");

  if (!id || !status) {
    return { ok: false, message: "id та status обов'язкові." };
  }

  const update: Record<string, unknown> = { status };
  if (status === "sent") {
    update.sent_at = new Date().toISOString();
  }

  const { error } = await supabase.from("invoices").update(update).eq("id", id);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Статус рахунку оновлено." };
}

export async function registerPaymentAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  const invoiceId = String(formData.get("invoice_id") || "");
  const orderId = String(formData.get("order_id") || "");
  const amount = Number(formData.get("amount") || 0);
  const method = String(formData.get("method") || "bank_transfer") as PaymentMethod;
  const notes = String(formData.get("notes") || "");
  const paidAt = String(formData.get("paid_at") || new Date().toISOString());

  if (!invoiceId || !orderId || amount <= 0) {
    return { ok: false, message: "invoice_id, order_id та amount обов'язкові." };
  }

  const { error } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    order_id: orderId,
    amount,
    method,
    notes: notes || null,
    paid_at: paidAt,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Оплату зареєстровано." };
}
