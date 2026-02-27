import { Container } from "@/components/ui/container";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <section className="py-20">
      <Container className="max-w-lg">
        <div className="space-y-4 text-center">
          <h1 className="font-display text-4xl text-[var(--color-text-primary)]">Вхід в адмін-панель</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Лише для власника майстерні</p>
        </div>
        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </Container>
    </section>
  );
}

