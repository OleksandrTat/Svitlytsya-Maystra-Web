import { AdminShell } from "@/components/admin/admin-shell";
import { OrdersWorkspace } from "@/components/admin/orders/orders-workspace";
import {
  getOrdersForAdmin, getAllProjectsForAdmin, getAllProductsForAdmin,
  getAllInquiriesForAdmin, getClientsForAdmin,
} from "@/lib/data/queries";

export default async function AdminOrdersPage() {
  const [rawOrders, inquiries, clients, projects, products] = await Promise.all([
    getOrdersForAdmin(300),
    getAllInquiriesForAdmin(),
    getClientsForAdmin(500),
    getAllProjectsForAdmin(),
    getAllProductsForAdmin(),
  ]);

  const inquiryMap = new Map(inquiries.map((i: any) => [i.id, i]));
  const clientMap  = new Map(clients.map((c: any) => [c.id, c]));

  const orders = rawOrders.map((o: any) => {
    const inq    = o.inquiry_id ? inquiryMap.get(o.inquiry_id) as any : null;
    const client = o.user_id    ? clientMap.get(o.user_id) as any : null;
    return { ...o, clientName: client?.display_name ?? inq?.name ?? "Клієнт", serviceType: inq?.service_type ?? "—" };
  });

  return (
    <AdminShell title="Замовлення" description="Workspace: Замовлення → Проєкт → Продукти">
      <OrdersWorkspace orders={orders as any} projects={projects as any} products={products as any} />
    </AdminShell>
  );
}
