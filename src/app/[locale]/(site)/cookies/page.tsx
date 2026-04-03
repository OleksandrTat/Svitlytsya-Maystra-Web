import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/layout/legal-page-layout";

export const metadata: Metadata = {
  title: "Політика Cookie",
};

const SECTIONS = [
  { id: "what-are-cookies", title: "Що таке Cookies" },
  { id: "types", title: "Типи Cookies" },
  { id: "management", title: "Керування Cookies" },
];

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Політика Cookie"
      lastUpdated="01.01.2025"
      sections={SECTIONS}
    >
      <section id="what-are-cookies">
        <h2>Що таке Cookies</h2>
        <p>
          Cookies — це невеликі текстові файли, які зберігаються у вашому
          браузері при відвідуванні вебсайту. Вони допомагають забезпечити
          коректну роботу сайту та покращити ваш досвід.
        </p>
      </section>

      <section id="types">
        <h2>Типи Cookies, які ми використовуємо</h2>
        <h3>Технічні (обов&rsquo;язкові)</h3>
        <p>
          Необхідні для коректної роботи сесій, авторизації та базової
          функціональності сайту. Без них сайт не зможе працювати належним
          чином.
        </p>
        <h3>Аналітичні</h3>
        <p>
          Сайт використовує аналітичні cookies PostHog для оцінки поведінки
          користувачів. Ці дані допомагають нам покращувати сайт та послуги.
        </p>
        <p>
          При першому відвідуванні ви можете прийняти або відхилити аналітичні
          cookies через банер. Якщо ви відмовляєтесь від аналітичних cookies,
          PostHog не ініціалізується.
        </p>
      </section>

      <section id="management">
        <h2>Керування Cookies</h2>
        <p>
          Ви можете керувати cookies через налаштування вашого браузера.
          Зверніть увагу, що вимкнення технічних cookies може вплинути на роботу
          сайту.
        </p>
        <p>
          Для зміни налаштувань аналітичних cookies ви можете скористатися
          банером, який з&rsquo;являється при першому відвідуванні, або
          очистити cookies у браузері.
        </p>
      </section>
    </LegalPageLayout>
  );
}
