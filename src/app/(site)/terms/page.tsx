import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms of Use",
};

export default function TermsPage() {
  return (
    <section className="py-14 md:py-20">
      <Container className="max-w-4xl">
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">Terms of Use</h1>
        <div className="prose mt-8 max-w-none text-[var(--color-text-secondary)]">
          <p>
            Використовуючи сайт Svitlytsya Maystra, ви погоджуєтесь з цими умовами. Контент сайту надається для інформаційних цілей.
          </p>
          <p>
            Умови, строки та вартість виконання робіт узгоджуються індивідуально в межах конкретного замовлення.
          </p>
          <p>
            Фото, тексти та візуальні матеріали є об’єктами авторського права і не можуть використовуватись без письмового дозволу.
          </p>
          <p>
            Компанія не несе відповідальності за непрямі збитки, що виникли внаслідок використання або неможливості використання сайту.
          </p>
        </div>
      </Container>
    </section>
  );
}


