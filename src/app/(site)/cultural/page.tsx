import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function CulturalBlogPage() {
  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">
          Cultural Journal
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Cultural blog list will be published in Stage 2.
        </p>
        <Link
          href="/cultural/example"
          className="mt-6 inline-block text-sm text-[var(--color-primary)] underline"
        >
          Open sample cultural article route
        </Link>
      </Container>
    </section>
  );
}
