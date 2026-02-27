"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/projects", label: "Проєкти" },
  { href: "/admin/services", label: "Послуги" },
  { href: "/admin/testimonials", label: "Відгуки" },
  { href: "/admin/inquiries", label: "Заявки" },
  { href: "/admin/chat", label: "AI Chat" },
  { href: "/admin/audit-log", label: "Audit" },
  { href: "/admin/security", label: "Security" },
  { href: "/admin/settings", label: "Налаштування" },
  { href: "/admin/logs", label: "Legacy Logs" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const onSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="rounded-3xl border border-[var(--color-border)] bg-white p-4">
      <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
        Адмін-панель
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-2 text-sm ${
                active
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-5 w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
      >
        Вийти
      </button>
    </aside>
  );
}