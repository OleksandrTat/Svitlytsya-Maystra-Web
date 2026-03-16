"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { env, hasResend } from "@/lib/env";

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

  if (hasResend) {
    const resend = new Resend(env.resendApiKey!);
    const inviteUrl = `${env.siteUrl}/auth/register?invite=${invitation.token}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
      from: env.resendFromEmail!,
      to: email,
      subject: "Запрошення до Svitlytsya Maystra — особистий кабінет",
      html: `
        <h2>Вітаємо${displayName ? `, ${displayName}` : ""}!</h2>
        <p>Вас запрошено до особистого кабінету майстерні Svitlytsya Maystra.</p>
        <p>Тут ви зможете відстежувати статус свого замовлення, переглядати рахунки та спілкуватись з майстернею.</p>
        <p>
          <a href="${inviteUrl}" style="
            display: inline-block;
            background: #1A4F8A;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          ">
            Створити акаунт
          </a>
        </p>
        <p style="color: #718096; font-size: 12px;">
          Посилання дійсне 7 днів. Якщо ви не очікували цього листа — ігноруйте його.
        </p>
      `,
    });
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/clients");

  return {
    ok: true,
    message: hasResend
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
