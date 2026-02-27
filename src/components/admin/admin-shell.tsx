import { Container } from "@/components/ui/container";
import { AdminNav } from "@/components/admin/admin-nav";

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-8">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <AdminNav />

          <main className="space-y-6">
            <header className="space-y-2">
              <h1 className="font-display text-3xl text-[var(--color-text-primary)]">{title}</h1>
              {description ? <p className="text-sm text-[var(--color-text-secondary)]">{description}</p> : null}
            </header>
            {children}
          </main>
        </div>
      </Container>
    </div>
  );
}

