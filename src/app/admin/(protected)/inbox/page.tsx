import Link from "next/link";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { formatInquiryDate } from "@/lib/utils";

type InboxThread = {
  orderId: string;
  orderNumber: string;
  status: string;
  unread: number;
  lastMessage: string;
  lastMessageAt: string;
};

async function getInboxThreads(): Promise<InboxThread[]> {
  const db = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!db) {
    return [];
  }

  const { data: messages } = await db
    .from("order_messages")
    .select("order_id, content, created_at, sender_type, is_read")
    .order("created_at", { ascending: false })
    .limit(300);

  if (!messages || messages.length === 0) {
    return [];
  }

  const byOrder = new Map<
    string,
    {
      unread: number;
      lastMessage: string;
      lastMessageAt: string;
    }
  >();

  for (const message of messages) {
    const existing = byOrder.get(message.order_id);
    if (!existing) {
      byOrder.set(message.order_id, {
        unread: message.sender_type === "client" && !message.is_read ? 1 : 0,
        lastMessage: message.content,
        lastMessageAt: message.created_at,
      });
      continue;
    }

    if (message.sender_type === "client" && !message.is_read) {
      existing.unread += 1;
    }
  }

  const orderIds = [...byOrder.keys()];
  const { data: orders } = await db
    .from("orders")
    .select("id, order_number, status")
    .in("id", orderIds);

  if (!orders) {
    return [];
  }

  return orders
    .map((order) => {
      const meta = byOrder.get(order.id);
      if (!meta) {
        return null;
      }

      return {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        unread: meta.unread,
        lastMessage: meta.lastMessage,
        lastMessageAt: meta.lastMessageAt,
      };
    })
    .filter((thread): thread is InboxThread => thread !== null)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export default async function AdminInboxPage() {
  const threads = await getInboxThreads();

  return (
    <AdminShell
      title="Smart Inbox"
      description="Єдиний список повідомлень по замовленнях: пріоритезуйте непрочитані та відповідайте швидше."
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <AdminCard className="max-h-[70vh] overflow-y-auto p-0">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Потоки повідомлень</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Всього: {threads.length} · Непрочитаних:{" "}
              {threads.reduce((sum, thread) => sum + thread.unread, 0)}
            </p>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {threads.length === 0 ? (
              <p className="p-4 text-sm text-[var(--color-text-secondary)]">Повідомлень поки немає.</p>
            ) : (
              threads.map((thread) => (
                <Link
                  key={thread.orderId}
                  href={`/admin/orders/${thread.orderId}`}
                  className="block px-4 py-3 transition hover:bg-[var(--color-bg-section)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {thread.orderNumber}
                    </p>
                    {thread.unread > 0 ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                        {thread.unread}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
                    {thread.lastMessage}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                    {formatInquiryDate(thread.lastMessageAt)} · {thread.status}
                  </p>
                </Link>
              ))
            )}
          </div>
        </AdminCard>

        <AdminCard className="p-0">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Оберіть чат зі списку ліворуч
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Для відповіді клієнту відкрийте потрібне замовлення. Тут буде повноцінний 3-панельний inbox.
            </p>
          </div>
          <div className="p-5 text-sm text-[var(--color-text-secondary)]">
            Швидкий перехід: натисніть <kbd className="rounded border px-1">Ctrl/Cmd + K</kbd>, введіть номер
            замовлення і відкрийте картку.
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}

