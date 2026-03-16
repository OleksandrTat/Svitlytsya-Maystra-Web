"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth/require-admin";
import { env, hasResend } from "@/lib/env";
import { sanitizeCommentContent } from "@/lib/security/sanitize";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

type ActionResult = {
  ok: boolean;
  message: string;
};

type DbErrorLike = {
  code?: string;
  message: string;
};

function mapInsertCommentError(error: DbErrorLike) {
  if (error.code === "42P01" || /relation .*blog_comments.* does not exist/i.test(error.message)) {
    return "У базі даних відсутня таблиця коментарів. Виконай SQL-міграцію для blog_comments.";
  }

  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "Не вдалося підтвердити сесію користувача. Вийди з акаунта, увійди знову та повтори.";
  }

  if (error.code === "23503") {
    return "Не вдалося додати коментар: стаття або користувач не знайдені у базі.";
  }

  return error.message;
}

export async function addCommentAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Увійдіть, щоб залишити коментар." };
  }

  const postId = String(formData.get("post_id") || "");
  const postSlug = String(formData.get("post_slug") || "");
  const parentId = String(formData.get("parent_id") || "");
  const content = sanitizeCommentContent(String(formData.get("content") || ""));

  if (!postId || !content) {
    return { ok: false, message: "Коментар не може бути порожнім." };
  }

  const { data: post, error: postError } = await supabase
    .from("cultural_blog_posts")
    .select("id,allow_comments,is_published")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    return { ok: false, message: postError.message };
  }

  if (!post || !post.is_published || !post.allow_comments) {
    return { ok: false, message: "Коментування для цієї статті вимкнено." };
  }

  const writeClient = createSupabaseServiceClient() ?? supabase;

  const { error } = await writeClient.from("blog_comments").insert({
    post_id: postId,
    user_id: user.id,
    parent_id: parentId || null,
    content: content.slice(0, 2000),
    status: "pending",
  });

  if (error) {
    return { ok: false, message: mapInsertCommentError(error) };
  }

  if (hasResend) {
    const resend = new Resend(env.resendApiKey!);
    await resend.emails.send({
      from: env.resendFromEmail!,
      to: env.adminEmail!,
      subject: "Новий коментар потребує модерації",
      text: [
        `Користувач: ${user.email ?? user.id}`,
        `Текст: ${content.slice(0, 400)}`,
        "Модерація: /admin/cultural",
      ].join("\n"),
    });
  }

  if (postSlug) {
    revalidatePath(`/cultural/${postSlug}`);
  }
  revalidatePath("/admin/cultural");

  return { ok: true, message: "Коментар надіслано на модерацію." };
}

export async function approveCommentAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "");
  const postSlug = String(formData.get("post_slug") || "");
  if (!id) {
    return { ok: false, message: "Comment ID is required." };
  }

  const { error } = await supabase
    .from("blog_comments")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/cultural");
  if (postSlug) {
    revalidatePath(`/cultural/${postSlug}`);
  }

  return { ok: true, message: "Коментар схвалено." };
}

export async function rejectCommentAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "");
  const postSlug = String(formData.get("post_slug") || "");
  if (!id) {
    return { ok: false, message: "Comment ID is required." };
  }

  const { error } = await supabase
    .from("blog_comments")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/cultural");
  if (postSlug) {
    revalidatePath(`/cultural/${postSlug}`);
  }

  return { ok: true, message: "Коментар відхилено." };
}
