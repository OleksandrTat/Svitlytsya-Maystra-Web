import { Container } from "@/components/ui/container";

export default async function ConstructorTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">
          Product Constructor: {type}
        </h1>
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Interactive constructor UI will be implemented in Stage 2.
        </p>
      </Container>
    </section>
  );
}
