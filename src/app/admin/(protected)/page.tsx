import Link from "next/link";
import { BellDot, Mail, Package, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
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
      title: `inquiry:${inquiry.name}`,
      meta: inquiry.service_type ?? "",
      href: "/admin/inquiries",
      time: inquiry.created_at,
    })),
    ...(statusesResult.data ?? []).map((status) => ({
      id: `status-${status.id}`,
      type: "order_status" as const,
      title: "order_status_change",
      meta: status.to_status,
      href: `/admin/orders/${status.order_id}`,
      time: status.created_at,
    })),
    ...(messagesResult.data ?? []).map((message) => ({
      id: `msg-${message.id}`,
      type: "message" as const,
      title: "new_client_message",
      meta: message.content.slice(0, 90),
      href: `/admin/orders/${message.order_id}`,
      time: message.created_at,
    })),
  ];

  return events
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit);
}

export default async function AdminDashboardPage() {
  const [t, baseStats, dashboardMetrics, feedEvents] = await Promise.all([
    getTranslations("admin.pages.dashboard"),
    getDashboardStats(),
    getDashboardMetrics(),
    getInitialFeed(),
  ]);

  const quickActions = [
    { label: t("openInquiries"), href: "/admin/inquiries" },
    { label: t("inboxMessages"), href: "/admin/inbox" },
    { label: t("ordersList"), href: "/admin/orders" },
    { label: t("clientBase"), href: "/admin/clients" },
    { label: t("pricing"), href: "/admin/pricing" },
    { label: t("settingsLink"), href: "/admin/settings" },
  ];

  // Resolve feed event titles with translations
  const resolvedFeedEvents = feedEvents.map((event) => {
    if (event.title.startsWith("inquiry:")) {
      return { ...event, title: t("newInquiryFrom", { name: event.title.slice(8) }) };
    }
    if (event.title === "order_status_change") {
      return { ...event, title: t("orderStatusChange"), meta: t("orderStatus", { status: event.meta }) };
    }
    if (event.title === "new_client_message") {
      return { ...event, title: t("newClientMessage") };
    }
    return event;
  });

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard
          label={t("newInquiriesToday")}
          value={baseStats.newInquiriesToday}
          icon={<Mail size={18} className="text-[var(--color-primary)]" />}
          href="/admin/inquiries"
          urgent
        />
        <StatCard
          label={t("activeOrders")}
          value={dashboardMetrics.activeOrders}
          icon={<Package size={18} className="text-[var(--color-primary)]" />}
          href="/admin/orders"
        />
        <StatCard
          label={t("unreadMessages")}
          value={dashboardMetrics.unreadMessages}
          icon={<BellDot size={18} className="text-[var(--color-primary)]" />}
          href="/admin/inbox"
          urgent
        />
        <StatCard
          label={t("inquiriesThisMonth")}
          value={dashboardMetrics.inquiriesThisMonth}
          icon={<Sparkles size={18} className="text-[var(--color-primary)]" />}
          href="/admin/inquiries"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <LiveFeed initial={resolvedFeedEvents} />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t("priorityTasks")}</h2>
          <TodayTasks />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t("quickActions")}</h2>
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
