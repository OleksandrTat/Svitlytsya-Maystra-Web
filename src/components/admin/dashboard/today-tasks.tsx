import Link from "next/link";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { formatInquiryDate } from "@/lib/utils";

type TaskItem = {
  id: string;
  label: string;
  href: string;
  badge: string;
  urgent?: boolean;
};

function TaskRow({ task }: { task: TaskItem }) {
  return (
    <Link
      href={task.href}
      className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 transition hover:bg-[var(--color-bg-section)]"
    >
      <span
        className={`mt-0.5 rounded-md p-1.5 ${
          task.urgent ? "bg-red-100 text-red-600" : "bg-[var(--color-primary-100)] text-[var(--color-primary)]"
        }`}
      >
        {task.urgent ? <AlertTriangle size={14} /> : <CalendarClock size={14} />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{task.label}</p>
        <p className={`text-xs ${task.urgent ? "text-red-600" : "text-[var(--color-text-secondary)]"}`}>
          {task.badge}
        </p>
      </div>
    </Link>
  );
}

export async function TodayTasks() {
  const db = createSupabaseServiceClient() ?? (await createSupabaseServerClient());

  if (!db) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <p className="text-sm text-[var(--color-text-secondary)]">Немає підключення до БД.</p>
      </div>
    );
  }

  const today = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const todayIso = today.toISOString().slice(0, 10);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const [urgentOrdersResult, unansweredInquiriesResult] = await Promise.all([
    db
      .from("orders")
      .select("id, order_number, expected_date, status")
      .in("expected_date", [todayIso, tomorrowIso])
      .not("status", "in", "(completed,archived)")
      .order("expected_date", { ascending: true })
      .limit(20),
    db
      .from("inquiries")
      .select("id, name, created_at")
      .eq("status", "new")
      .lt("created_at", twoHoursAgo)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  const tasks: TaskItem[] = [
    ...((unansweredInquiriesResult.data ?? []).map((inquiry) => ({
      id: `inq-${inquiry.id}`,
      label: `Заявка від ${inquiry.name}`,
      href: `/admin/inquiries#${inquiry.id}`,
      badge: `Без відповіді понад 2 години · ${formatInquiryDate(inquiry.created_at)}`,
      urgent: true,
    })) satisfies TaskItem[]),
    ...((urgentOrdersResult.data ?? []).map((order) => ({
      id: `ord-${order.id}`,
      label: `${order.order_number} · дедлайн ${order.expected_date === todayIso ? "сьогодні" : "завтра"}`,
      href: `/admin/orders/${order.id}`,
      badge: `Статус: ${order.status}`,
    })) satisfies TaskItem[]),
  ];

  return (
    <section className="space-y-2">
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">Критичних задач на зараз немає.</p>
        </div>
      ) : (
        tasks.map((task) => <TaskRow key={task.id} task={task} />)
      )}
    </section>
  );
}

