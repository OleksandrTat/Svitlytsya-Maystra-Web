import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cookie Policy",
};

export default function CookiesPage() {
  return (
    <section className="py-14 md:py-20">
      <Container className="max-w-4xl">
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">Cookie Policy</h1>
        <div className="prose mt-8 max-w-none text-[var(--color-text-secondary)]">
          <p>
            Сайт використовує технічні cookies для коректної роботи сесій та аналітичні cookies PostHog для оцінки поведінки користувачів.
          </p>
          <p>
            При першому відвідуванні ви можете прийняти або відхилити аналітичні cookies через banner.
          </p>
          <p>
            Якщо ви відмовляєтесь від аналітичних cookies, PostHog не ініціалізується.
          </p>
        </div>
      </Container>
    </section>
  );
}

