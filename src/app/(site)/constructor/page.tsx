import Link from "next/link";
import { Container } from "@/components/ui/container";

const products = [
  {
    type: "door",
    label: "Двері",
    description: "Міжкімнатні, вхідні, комори",
    icon: "🚪",
  },
  {
    type: "furniture",
    label: "Меблі",
    description: "Шафи, столи, тумби",
    icon: "🪑",
  },
];

export default function ConstructorPage() {
  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">
          Конструктор виробу
        </h1>
        <p className="mt-3 max-w-xl text-sm text-[var(--color-text-secondary)]">
          Оберіть тип виробу та налаштуйте параметри, щоб сформувати технічне завдання для майстерні.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:max-w-2xl">
          {products.map((product) => (
            <Link
              key={product.type}
              href={`/constructor/${product.type}`}
              className="rounded-3xl border border-[var(--color-border)] bg-white p-6 transition hover:border-[var(--color-primary)]"
            >
              <p className="text-4xl">{product.icon}</p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--color-text-primary)]">
                {product.label}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{product.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
