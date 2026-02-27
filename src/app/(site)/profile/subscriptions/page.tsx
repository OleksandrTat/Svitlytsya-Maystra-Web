import { Container } from "@/components/ui/container";

export default function SubscriptionPreferencesPage() {
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">
            Subscriptions
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Subscription preferences UI will be implemented in Stage 2.
          </p>
        </div>
      </Container>
    </section>
  );
}
