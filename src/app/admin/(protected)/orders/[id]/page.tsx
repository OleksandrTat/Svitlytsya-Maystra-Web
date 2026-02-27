import { addAdminOrderMessageAction, updateOrderStatusAction } from "@/actions/orders";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import {
  getOrderByIdForAdmin,
  getOrderMessagesByOrderForAdmin,
  getOrderTimelineForAdmin,
} from "@/lib/data/queries";
import type { OrderStatus } from "@/lib/types";
import { formatInquiryDate } from "@/lib/utils";

type Params = {
  id: string;
};

const statuses: OrderStatus[] = [
  "new",
  "consulting",
  "design",
  "approved",
  "production",
  "ready",
  "installation",
  "completed",
  "archived",
];

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const [order, timeline, messages] = await Promise.all([
    getOrderByIdForAdmin(id),
    getOrderTimelineForAdmin(id),
    getOrderMessagesByOrderForAdmin(id),
  ]);

  const updateStatus = async (formData: FormData) => {
    "use server";
    await updateOrderStatusAction(formData);
  };

  const sendAdminMessage = async (formData: FormData) => {
    "use server";
    await addAdminOrderMessageAction(formData);
  };

  if (!order) {
    return (
      <AdminShell title="Order Not Found">
        <AdminCard>
          <p className="text-sm text-[var(--color-text-secondary)]">Order does not exist.</p>
        </AdminCard>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`Order ${order.order_number}`} description="Картка замовлення та внутрішня комунікація">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AdminCard>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Main info</h2>
          <div className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Status:</span>{" "}
              <OrderStatusBadge status={order.status} />
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Expected:</span>{" "}
              {order.expected_date ?? "-"}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Internal notes:</span>{" "}
              {order.internal_notes ?? "-"}
            </p>
          </div>

          <form action={updateStatus} className="mt-6 space-y-3">
            <input type="hidden" name="order_id" value={order.id} />
            <select name="status" defaultValue={order.status} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <textarea
              name="comment"
              rows={3}
              placeholder="Comment for timeline"
              className="w-full rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm"
            />
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" name="is_visible_to_client" defaultChecked />
              Visible to client
            </label>
            <button type="submit" className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white">
              Update status
            </button>
          </form>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">Timeline</h2>
          <OrderTimeline items={timeline} />
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Order Chat</h2>
        <div className="mt-4 space-y-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
              <p className="text-xs text-[var(--color-text-secondary)]">
                {message.sender_type} · {formatInquiryDate(message.created_at)}
              </p>
              <p className="mt-1">{message.content}</p>
            </article>
          ))}
        </div>

        <form action={sendAdminMessage} className="mt-5 space-y-3">
          <input type="hidden" name="order_id" value={order.id} />
          <textarea
            name="content"
            required
            rows={3}
            placeholder="Type a message to client..."
            className="w-full rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white">
            Send message
          </button>
        </form>
      </AdminCard>
    </AdminShell>
  );
}
