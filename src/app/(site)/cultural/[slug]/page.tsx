import { Container } from "@/components/ui/container";

export default async function CulturalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">
          Cultural Article: {slug}
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Article content and comment section will be implemented in Stage 2.
        </p>
      </Container>
    </section>
  );
}
