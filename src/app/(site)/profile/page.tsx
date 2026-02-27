import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function ProfilePage() {
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Profile</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Кабінет клієнта: керування підписками, замовленнями та персональними даними.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/profile/orders" className="underline">
              Мої замовлення
            </Link>
            <Link href="/profile/subscriptions" className="underline">
              Підписки
            </Link>
            <Link href="/profile/data" className="underline">
              GDPR: мої дані
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}