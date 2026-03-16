import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupportChatMessages } from "@/lib/data/queries";
import { sendSupportMessageAction } from "@/actions/support";
import { formatInquiryDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
    <section className="py-16">
      <Container className="max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl text-[var(--color-text-primary)]">
            {chat.subject ?? "Звернення"}
          </h1>
          <a href="/profile/support" className="text-sm underline">
            Всі звернення
          </a>
        </div>

        <div className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
          {messages.length === 0 && (
            <p className="text-sm text-[var(--color-text-secondary)]">Поки немає повідомлень.</p>
          )}
          {messages.map((msg) => (
            <article
              key={msg.id}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                msg.sender_type === "client"
                  ? "ml-auto bg-[var(--color-primary)] text-white"
                  : msg.sender_type === "admin"
                    ? "bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    : "mx-auto bg-zinc-100 text-center text-xs text-zinc-500",
              )}
            >
              {msg.sender_type !== "system" && (
                <p className="mb-1 text-[11px] opacity-70">
                  {msg.sender_type === "client" ? "Ви" : "Майстерня"}
                </p>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="mt-1 text-[10px] opacity-60">{formatInquiryDate(msg.created_at)}</p>
            </article>
          ))}
        </div>

        {chat.status !== "closed" && chat.status !== "resolved" && (
          <form action={sendMessage} className="mt-4 space-y-3">
            <input type="hidden" name="chat_id" value={id} />
            <textarea
              name="content"
              required
              rows={3}
              placeholder="Напишіть повідомлення..."
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white"
            >
              Надіслати
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}
