import { Container } from "@/components/ui/container";

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">
          Blog Article: {slug}
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Full article rendering will be implemented in Stage 2.
        </p>
      </Container>
    </section>
  );
}
