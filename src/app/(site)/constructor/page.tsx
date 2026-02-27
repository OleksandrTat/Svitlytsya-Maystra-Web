import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function ConstructorPage() {
  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">Constructor</h1>
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Select a product type to start configuration.
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/constructor/door" className="text-sm text-[var(--color-primary)] underline">
            Door constructor
          </Link>
          <Link
            href="/constructor/furniture"
            className="text-sm text-[var(--color-primary)] underline"
          >
            Furniture constructor
          </Link>
        </div>
      </Container>
    </section>
  );
}
