import { Container } from "@/components/ui/container";

export default function ForgotPasswordPage() {
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-xl rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Forgot Password</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Password reset flow will be added in Stage 2.
          </p>
        </div>
      </Container>
    </section>
  );
}
