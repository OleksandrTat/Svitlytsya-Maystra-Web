import Link from "next/link";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSupportChatsForAdmin, getSupportChatMessagesForAdmin } from "@/lib/data/queries";
import { sendAdminSupportMessageAction, closeSupportChatAction } from "@/actions/support";
import { cn, formatInquiryDate } from "@/lib/utils";

const STATUS_COLORS = {
  open: "bg-green-100 text-green-800",
  waiting: "bg-amber-100 text-amber-800",
  resolved: "bg-zinc-100 text-zinc-600",
  closed: "bg-zinc-100 text-zinc-500",
};

const STATUS_LABELS = {
  open: "Відкрито",
  waiting: "Очікує",
  resolved: "Вирішено",
  closed: "Закрито",
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const selectedChatId = params.chat;

  const chats = await getSupportChatsForAdmin(100);
  const activeChat = chats.find((chat) => chat.id === selectedChatId) ?? chats[0] ?? null;
  const messages = activeChat ? await getSupportChatMessagesForAdmin(activeChat.id) : [];

  const sendMessage = async (formData: FormData) => {
    "use server";
    await sendAdminSupportMessageAction(formData);
  };

  const closeChat = async (formData: FormData) => {
    "use server";
    await closeSupportChatAction(formData);
  };

  return (
    <AdminShell
      title="Підтримка клієнтів"
      description="Внутрішні звернення від зареєстрованих клієнтів."
    >
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <AdminCard className="max-h-[75vh] overflow-y-auto p-0">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Звернення</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Усього: {chats.length} · Непрочитаних: {chats.reduce((sum, chat) => sum + chat.unread_count, 0)}
            </p>
          </div>

          {chats.length === 0 ? (
            <p className="p-4 text-sm text-[var(--color-text-secondary)]">Звернень поки немає.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    href={`/admin/support?chat=${chat.id}`}
                    className={cn(
                      "block px-4 py-3 transition hover:bg-[var(--color-bg-section)]",
                      activeChat?.id === chat.id && "bg-[var(--color-surface)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                        {chat.user_display_name ?? "Клієнт"}
                      </p>
                      <div className="flex items-center gap-2">
                        {chat.unread_count > 0 && (
                          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                            {chat.unread_count}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            STATUS_COLORS[chat.status as keyof typeof STATUS_COLORS]
                          }`}
                        >
                          {STATUS_LABELS[chat.status as keyof typeof STATUS_LABELS]}
                        </span>
                      </div>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                      {chat.subject ?? "Без теми"}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                      {formatInquiryDate(chat.last_message_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard>
          {!activeChat ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Оберіть звернення зліва.</p>
          ) : (
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {activeChat.user_display_name ?? "Клієнт"}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {activeChat.subject ?? "Без теми"}
                  </p>
                </div>
                <form action={closeChat}>
                  <input type="hidden" name="chat_id" value={activeChat.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
                  >
                    Закрити чат
                  </button>
                </form>
              </div>

              <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <article
                    key={msg.id}
                    className={cn(
                      "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.sender_type === "client"
                        ? "bg-[var(--color-surface)]"
                        : "ml-auto bg-[var(--color-primary)] text-white",
                    )}
                  >
                    <p className="mb-1 text-[11px] uppercase tracking-wide opacity-70">
                      {msg.sender_type === "client" ? "Клієнт" : "Ви"}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="mt-2 text-[11px] opacity-60">{formatInquiryDate(msg.created_at)}</p>
                  </article>
                ))}
              </div>

              <form action={sendMessage} className="mt-auto space-y-3">
                <input type="hidden" name="chat_id" value={activeChat.id} />
                <textarea
                  name="content"
                  required
                  rows={3}
                  placeholder="Відповідь клієнту..."
                  className="w-full rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white"
                >
                  Відповісти
                </button>
              </form>
            </div>
          )}
        </AdminCard>
      </div>
    </AdminShell>
  );
}
