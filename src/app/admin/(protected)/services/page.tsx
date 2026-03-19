import { AdminShell } from "@/components/admin/admin-shell";
import { ServicesAdminClient } from "@/components/admin/services/services-admin-client";
import { getAllServicesForAdmin } from "@/lib/data/queries";

export default async function AdminServicesPage() {
  const services = await getAllServicesForAdmin();

  return (
    <AdminShell
      title="Управління послугами"
      description="Керуйте переліком сервісів, featured картками, SEO та таймлайном роботи."
    >
      <ServicesAdminClient services={services} />
    </AdminShell>
  );
}
