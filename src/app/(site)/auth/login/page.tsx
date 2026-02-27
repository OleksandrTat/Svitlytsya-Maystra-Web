import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function LoginPage() {
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-xl rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Login</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Account login UI will be added in Stage 2.
          </p>
          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
            Need an account?{" "}
            <Link href="/auth/register" className="text-[var(--color-primary)] underline">
              Register
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
