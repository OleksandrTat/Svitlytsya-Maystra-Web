import { AdminShell } from "@/components/admin/admin-shell";
import { CalendarTimeline, type CalendarOrderItem } from "@/components/admin/calendar/calendar-timeline";
import { getAllInquiriesForAdmin, getClientsForAdmin, getOrdersForAdmin } from "@/lib/data/queries";
import { addDays } from "@/lib/admin/gantt-utils";

function deriveTimelineRows(params: {
  orders: Awaited<ReturnType<typeof getOrdersForAdmin>>;
  inquiries: Awaited<ReturnType<typeof getAllInquiriesForAdmin>>;
  clients: Awaited<ReturnType<typeof getClientsForAdmin>>;
}): CalendarOrderItem[] {
  const inquiryMap = new Map(params.inquiries.map((inquiry) => [inquiry.id, inquiry]));
  const clientMap = new Map(params.clients.map((client) => [client.id, client.display_name]));

  return params.orders
    .filter((order) => order.status !== "archived")
    .map((order) => {
      const inquiry = order.inquiry_id ? inquiryMap.get(order.inquiry_id) : null;
      const clientName = order.user_id
        ? clientMap.get(order.user_id) ?? inquiry?.name ?? "Клієнт"
        : inquiry?.name ?? "Клієнт";
      const startDate = order.created_at;
      const endDate = order.expected_date
        ? new Date(order.expected_date).toISOString()
        : addDays(new Date(order.created_at), 7).toISOString();

      return {
        id: order.id,
        orderNumber: order.order_number,
        clientName,
        serviceType: inquiry?.service_type ?? "Невідомо",
        status: order.status,
        startDate,
        endDate,
        expectedDate: order.expected_date,
      };
    })
    .sort((left, right) => {
      return new Date(left.startDate).getTime() - new Date(right.startDate).getTime();
    });
}

export default async function AdminCalendarPage() {
  const [orders, inquiries, clients] = await Promise.all([
    getOrdersForAdmin(500),
    getAllInquiriesForAdmin(),
    getClientsForAdmin(500),
  ]);

  const rows = deriveTimelineRows({ orders, inquiries, clients });

  return (
    <AdminShell
      title="Calendar"
      description="Таймлайн активних замовлень для контролю завантаження виробництва."
    >
      <CalendarTimeline orders={rows} />
    </AdminShell>
  );
}
