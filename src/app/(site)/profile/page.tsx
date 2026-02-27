import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function ProfilePage() {
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Profile</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Profile editor will be implemented in Stage 2.
          </p>
          <Link
            href="/profile/subscriptions"
            className="mt-6 inline-block text-sm text-[var(--color-primary)] underline"
          >
            Manage subscriptions
          </Link>
        </div>
      </Container>
    </section>
  );
}
