import Link from "next/link";
import { BellDot, Mail, Package, Sparkles } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/admin/dashboard/stat-card";
import { LiveFeed, type FeedEvent } from "@/components/admin/dashboard/live-feed";
import { TodayTasks } from "@/components/admin/dashboard/today-tasks";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/data/queries";

type DashboardMetrics = {
  activeOrders: number;
  unreadMessages: number;
  inquiriesThisMonth: number;
};

async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const db = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!db) {
    return {
      activeOrders: 0,
      unreadMessages: 0,
      inquiriesThisMonth: 0,
    };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [activeOrdersResult, unreadMessagesResult, monthInquiriesResult] = await Promise.all([
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(completed,archived)"),
    db
      .from("order_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_type", "client")
      .eq("is_read", false),
    db
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),
  ]);

  return {
    activeOrders: activeOrdersResult.count ?? 0,
    unreadMessages: unreadMessagesResult.count ?? 0,
    inquiriesThisMonth: monthInquiriesResult.count ?? 0,
  };
}

async function getInitialFeed(limit = 20): Promise<FeedEvent[]> {
  const db = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!db) {
    return [];
  }

  const [inquiriesResult, statusesResult, messagesResult] = await Promise.all([
    db.from("inquiries").select("id, name, service_type, created_at").order("created_at", { ascending: false }).limit(limit),
    db
      .from("order_status_history")
      .select("id, order_id, to_status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("order_messages")
      .select("id, order_id, sender_type, content, created_at")
      .eq("sender_type", "client")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const events: FeedEvent[] = [
    ...(inquiriesResult.data ?? []).map((inquiry) => ({
      id: `inq-${inquiry.id}`,
      type: "inquiry" as const,
      title: `Нова заявка від ${inquiry.name}`,
      meta: inquiry.service_type ?? "",
      href: "/admin/inquiries",
      time: inquiry.created_at,
    })),
    ...(statusesResult.data ?? []).map((status) => ({
      id: `status-${status.id}`,
      type: "order_status" as const,
      title: "Зміна статусу замовлення",
      meta: `Статус: ${status.to_status}`,
      href: `/admin/orders/${status.order_id}`,
      time: status.created_at,
    })),
    ...(messagesResult.data ?? []).map((message) => ({
      id: `msg-${message.id}`,
      type: "message" as const,
      title: "Нове повідомлення клієнта",
      meta: message.content.slice(0, 90),
      href: `/admin/orders/${message.order_id}`,
      time: message.created_at,
    })),
  ];

  return events
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit);
}

const quickActions = [
  { label: "Відкрити заявки", href: "/admin/inquiries" },
  { label: "Inbox повідомлень", href: "/admin/inbox" },
  { label: "Список замовлень", href: "/admin/orders" },
  { label: "Клієнтська база", href: "/admin/clients" },
  { label: "Ціноутворення", href: "/admin/pricing" },
  { label: "Налаштування", href: "/admin/settings" },
];

export default async function AdminDashboardPage() {
  const [baseStats, dashboardMetrics, feedEvents] = await Promise.all([
    getDashboardStats(),
    getDashboardMetrics(),
    getInitialFeed(),
  ]);

  return (
    <AdminShell
      title="Dashboard"
      description="Живий огляд операцій: заявки, замовлення, повідомлення та пріоритетні задачі."
    >
      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard
          label="Нові заявки сьогодні"
          value={baseStats.newInquiriesToday}
          icon={<Mail size={18} className="text-[var(--color-primary)]" />}
          href="/admin/inquiries"
          urgent
        />
        <StatCard
          label="Активні замовлення"
          value={dashboardMetrics.activeOrders}
          icon={<Package size={18} className="text-[var(--color-primary)]" />}
          href="/admin/orders"
        />
        <StatCard
          label="Непрочитані повідомлення"
          value={dashboardMetrics.unreadMessages}
          icon={<BellDot size={18} className="text-[var(--color-primary)]" />}
          href="/admin/inbox"
          urgent
        />
        <StatCard
          label="Заявки цього місяця"
          value={dashboardMetrics.inquiriesThisMonth}
          icon={<Sparkles size={18} className="text-[var(--color-primary)]" />}
          href="/admin/inquiries"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <LiveFeed initial={feedEvents} />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Пріоритетні задачі</h2>
          <TodayTasks />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Швидкі дії</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-primary)]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

