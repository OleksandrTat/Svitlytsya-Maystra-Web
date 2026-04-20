"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminNewSupportMessageEmail, adminSupportReplyEmail } from "@/lib/email/templates";
import { sendAdminEmail, sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import type { SupportChannel } from "@/lib/types";

type ActionResult = { ok: boolean; message: string; chatId?: string };

export async function startSupportChatAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Не вдалося підключитись." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Потрібно увійти." };
  }

  const subject = String(formData.get("subject") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const channel = String(formData.get("channel") || "internal") as SupportChannel;
  const preferredContact = String(formData.get("preferred_contact") || "").trim();
  const orderId = String(formData.get("order_id") || "").trim();

  if (!content) {
    return { ok: false, message: "Повідомлення не може бути порожнім." };
  }

  const writeClient = createSupabaseServiceClient() ?? supabase;

  if (channel !== "internal") {
    const contactHint =
      channel === "viber"
        ? `Viber: ${preferredContact}`
        : channel === "whatsapp"
          ? `WhatsApp: ${preferredContact}`
          : `Email: ${user.email}`;

    await sendAdminEmail({
      subject: `Клієнт хоче спілкуватись через ${channel}`,
      text: [
        `Клієнт: ${user.email ?? user.id}`,
        `Канал: ${channel}`,
        `Контакт: ${contactHint}`,
        `Тема: ${subject || "без теми"}`,
        `Повідомлення: ${content}`,
      ].join("\n"),
    });

    return { ok: true, message: `Ми зв'яжемось з вами через ${channel} найближчим часом.` };
  }

  const { data: existingChat } = await writeClient
    .from("support_chats")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["open", "waiting"])
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let chatId = existingChat?.id ?? null;

  if (!chatId) {
    const { data: chat, error: chatError } = await writeClient
      .from("support_chats")
      .insert({
        user_id: user.id,
        order_id: orderId || null,
        subject: subject || null,
        channel: "internal",
        status: "open",
      })
      .select("id")
      .single();

    if (chatError || !chat) {
      return { ok: false, message: "Не вдалося створити чат." };
    }

    chatId = chat.id;
  }

  const { error: msgError } = await writeClient
    .from("support_messages")
    .insert({
      chat_id: chatId,
      sender_type: "client",
      sender_id: user.id,
      content,
    });

  if (msgError) {
    return { ok: false, message: msgError.message };
  }

  const adminEmail = adminNewSupportMessageEmail({
    clientEmail: user.email ?? user.id,
    subject: subject || null,
    content,
    chatUrl: `${env.siteUrl}/admin/support?chat=${chatId}`,
  });

  await sendAdminEmail({
    subject: adminEmail.subject,
    html: adminEmail.html,
  });

  revalidatePath("/profile/support");
  revalidatePath("/admin/support");

  return { ok: true, message: "Чат розпочато.", chatId };
}

export async function sendSupportMessageAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Не вдалося підключитись." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Потрібно увійти." };
  }

  const chatId = String(formData.get("chat_id") || "");
  const content = String(formData.get("content") || "").trim();

  if (!chatId || !content) {
    return { ok: false, message: "chat_id та content обов'язкові." };
  }

  const { data: chat } = await supabase
    .from("support_chats")
    .select("id, status, subject")
    .eq("id", chatId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!chat) {
    return { ok: false, message: "Чат не знайдено." };
  }
  if (chat.status === "closed") {
    return { ok: false, message: "Цей чат закрито." };
  }

  const writeClient = createSupabaseServiceClient() ?? supabase;
  const { error } = await writeClient
    .from("support_messages")
    .insert({
      chat_id: chatId,
      sender_type: "client",
      sender_id: user.id,
      content,
    });

  if (error) {
    return { ok: false, message: error.message };
  }

  // Notify admin about the follow-up message.
  const adminEmail = adminNewSupportMessageEmail({
    clientEmail: user.email ?? user.id,
    subject: chat.subject ?? null,
    content,
    chatUrl: `${env.siteUrl}/admin/support?chat=${chatId}`,
  });

  await sendAdminEmail({
    subject: adminEmail.subject,
    html: adminEmail.html,
  });

  revalidatePath("/profile/support");
  revalidatePath(`/profile/support/${chatId}`);

  return { ok: true, message: "Повідомлення надіслано." };
}

export async function sendAdminSupportMessageAction(formData: FormData): Promise<ActionResult> {
  const adminUser = await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  const chatId = String(formData.get("chat_id") || "");
  const content = String(formData.get("content") || "").trim();

  if (!chatId || !content) {
    return { ok: false, message: "chat_id та content обов'язкові." };
  }

  const { error } = await supabase
    .from("support_messages")
    .insert({
      chat_id: chatId,
      sender_type: "admin",
      sender_id: adminUser.id,
      content,
    });

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase
    .from("support_chats")
    .update({ status: "open", last_message_at: new Date().toISOString() })
    .eq("id", chatId);

  const { data: chat } = await supabase
    .from("support_chats")
    .select("user_id")
    .eq("id", chatId)
    .maybeSingle();

  if (chat) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", chat.user_id)
      .maybeSingle();

    const { data: authUser } = await supabase.auth.admin.getUserById(chat.user_id);
    const clientEmail = authUser?.user?.email;

    if (clientEmail) {
      const replyEmail = adminSupportReplyEmail({
        displayName: profile?.display_name ?? null,
        content,
        chatUrl: `${env.siteUrl}/profile/support/${chatId}`,
      });

      await sendEmail({
        to: clientEmail,
        subject: replyEmail.subject,
        html: replyEmail.html,
      });
    }
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support?chat=${chatId}`);

  return { ok: true, message: "Відповідь надіслано." };
}

export async function closeSupportChatAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  const chatId = String(formData.get("chat_id") || "");
  if (!chatId) {
    return { ok: false, message: "chat_id обов'язковий." };
  }

  await supabase
    .from("support_chats")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", chatId);

  revalidatePath("/admin/support");
  return { ok: true, message: "Чат закрито." };
}
