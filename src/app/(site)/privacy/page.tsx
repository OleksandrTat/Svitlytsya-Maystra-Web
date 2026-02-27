import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <section className="py-14 md:py-20">
      <Container className="max-w-4xl">
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">Privacy Policy</h1>
        <div className="prose mt-8 max-w-none text-[var(--color-text-secondary)]">
          <p>Останнє оновлення: 2025-01-01.</p>
          <p>
            Ми збираємо дані, які ви добровільно залишаєте у формах: ім’я, телефон, email та зміст запиту.
            Дані використовуються виключно для обробки заявок і зв’язку з клієнтом.
          </p>
          <p>
            Дані не передаються третім особам, окрім технічних сервісів, які забезпечують роботу платформи (Supabase, Resend, PostHog).
          </p>
          <p>
            Ви можете звернутися на email для видалення або уточнення ваших персональних даних.
          </p>
        </div>
      </Container>
    </section>
  );
}


