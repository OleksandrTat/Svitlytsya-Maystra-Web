import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function BlogPage() {
  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">Blog</h1>
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Company blog listing page is scaffolded for Stage 2.
        </p>
        <Link
          href="/blog/example"
          className="mt-6 inline-block text-sm text-[var(--color-primary)] underline"
        >
          Open sample article route
        </Link>
      </Container>
    </section>
  );
}
