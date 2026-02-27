import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminSecurityPage() {
  return (
    <AdminShell
      title="Security"
      description="Налаштування безпеки: 2FA, rate limiting, backup readiness."
    >
      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">2FA (TOTP)</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Увімкніть MFA у Supabase Auth для адмін-акаунтів. На цьому етапі сторінка відображає
          операційний чеклист безпеки.
        </p>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Security checklist</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
          <li>2FA required for all admin users</li>
          <li>Turnstile enabled for inquiry form</li>
          <li>Signed URLs for private documents</li>
          <li>Monthly backup recovery test</li>
        </ul>
      </AdminCard>
    </AdminShell>
  );
}
