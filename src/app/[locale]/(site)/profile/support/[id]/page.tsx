import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProfileLayout } from "@/components/layout/profile-layout";
import { PageHero } from "@/components/ui/page-hero";
import { getSupportChatMessages } from "@/lib/data/queries";
import { sendSupportMessageAction } from "@/actions/support";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn, formatInquiryDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  open: "Відкрито",
  waiting: "Очікує відповіді",
  resolved: "Вирішено",
  closed: "Закрито",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  waiting: "bg-amber-100 text-amber-800",
  resolved: "bg-zinc-100 text-zinc-600",
  closed: "bg-zinc-100 text-zinc-500",
};

export default async function ProfileSupportChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const messages = await getSupportChatMessages(id, user.id);

  const { data: chat } = await supabase
    .from("support_chats")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!chat) {
    redirect("/profile/support");
  }

  const sendMessage = async (formData: FormData) => {
    "use server";
    await sendSupportMessageAction(formData);
  };

  return (
    <>
      <PageHero
        title={chat.subject ?? "Звернення"}
        breadcrumbs={[
          { label: "Головна", href: "/" },
          { label: "Профіль", href: "/profile" },
          { label: "Підтримка", href: "/profile/support" },
          { label: chat.subject ?? "Звернення" },
        ]}
        height="h-[180px]"
      />
      <ProfileLayout>
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/profile/support"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-700)]"
            >
              <ArrowLeft size={16} />
              Всі звернення
            </Link>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                STATUS_COLORS[chat.status] ?? "bg-zinc-100 text-zinc-600",
              )}
            >
              {STATUS_LABELS[chat.status] ?? chat.status}
            </span>
          </div>

          {/* Messages */}
          <div className="mt-6 space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] p-5">
            {messages.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                Поки немає повідомлень.
              </p>
            )}
            {messages.map((msg) => (
              <article
                key={msg.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  msg.sender_type === "client"
                    ? "ml-auto bg-[var(--color-primary)] text-white"
                    : msg.sender_type === "admin"
                      ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                      : "mx-auto bg-zinc-100 text-center text-xs text-zinc-500",
                )}
              >
                {msg.sender_type !== "system" && (
                  <p
                    className={cn(
                      "mb-1 text-[11px] font-medium",
                      msg.sender_type === "client" ? "text-white/70" : "text-[var(--color-text-muted)]",
                    )}
                  >
                    {msg.sender_type === "client" ? "Ви" : "Майстерня"}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    msg.sender_type === "client" ? "text-white/50" : "text-[var(--color-text-muted)]",
                  )}
                >
                  {formatInquiryDate(msg.created_at)}
                </p>
              </article>
            ))}
          </div>

          {/* Input */}
          {chat.status !== "closed" && chat.status !== "resolved" && (
            <form action={sendMessage} className="mt-4">
              <input type="hidden" name="chat_id" value={id} />
              <div className="flex gap-3">
                <textarea
                  name="content"
                  required
                  rows={2}
                  placeholder="Напишіть повідомлення..."
                  className="flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-shadow placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                />
                <button
                  type="submit"
                  className="self-end rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
                >
                  Надіслати
                </button>
              </div>
            </form>
          )}
        </div>
      </ProfileLayout>
    </>
  );
}
