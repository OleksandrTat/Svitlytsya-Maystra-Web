"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { clientInvitationEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

type ActionResult = { ok: boolean; message: string };

export async function createClientAccountFromInquiryAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  const inquiryId = String(formData.get("inquiry_id") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") || "").trim();
  const orderId = String(formData.get("order_id") || "");

  if (!inquiryId || !email) {
    return { ok: false, message: "inquiry_id та email обов'язкові." };
  }

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const existingUser = authUsers?.users?.find(
    (user: { id: string; email?: string | null }) => user.email === email,
  );

  if (existingUser) {
    if (orderId) {
      await supabase.from("orders").update({ user_id: existingUser.id }).eq("id", orderId);
    }

    revalidatePath("/admin/inquiries");
    revalidatePath("/admin/orders");
    return { ok: true, message: "Замовлення прив'язано до існуючого акаунту." };
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("client_invitations")
    .insert({
      inquiry_id: inquiryId || null,
      email,
      status: "pending",
      invited_by: null,
    })
    .select("id, token")
    .single();

  if (invitationError || !invitation) {
    return { ok: false, message: invitationError?.message ?? "Не вдалося створити запрошення." };
  }

  const inviteUrl = `${env.siteUrl}/auth/register?invite=${invitation.token}&email=${encodeURIComponent(email)}`;
  const invitationEmail = clientInvitationEmail({
    displayName: displayName || null,
    email,
    inviteUrl,
  });
  const emailResult = await sendEmail({
    to: email,
    subject: invitationEmail.subject,
    html: invitationEmail.html,
  });

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/clients");

  return {
    ok: true,
    message: emailResult.ok
      ? `Запрошення надіслано на ${email}.`
      : `Запрошення створено. Email не надіслано (Resend не налаштований). Токен: ${invitation.token}`,
  };
}

export async function linkOrderToClientAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  const orderId = String(formData.get("order_id") || "");
  const userId = String(formData.get("user_id") || "");

  if (!orderId || !userId) {
    return { ok: false, message: "order_id та user_id обов'язкові." };
  }

  const { error } = await supabase.from("orders").update({ user_id: userId }).eq("id", orderId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Замовлення прив'язано до клієнта." };
}
