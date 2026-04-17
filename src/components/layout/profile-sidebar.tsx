"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Heart, LogOut, MessageSquare, Package, User } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProfileUser = {
  displayName: string;
  email: string;
  avatarUrl?: string;
};

type Props = {
  user: ProfileUser;
};

const NAV_ITEMS = [
  { href: "/profile", label: "Мій профіль", icon: User },
  { href: "/profile/orders", label: "Замовлення", icon: Package },
  { href: "/profile/support", label: "Підтримка", icon: MessageSquare },
  { href: "/products?wishlist=1", label: "Вподобані", icon: Heart },
  { href: "/profile/data", label: "Мої дані", icon: FileText },
];

export function ProfileSidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/profile") return pathname === "/profile";
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-24 hidden h-fit max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl bg-[var(--color-bg-warm)] p-5 lg:block">
        {/* User info */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--color-border)]">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[var(--color-text-muted)]">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {user.displayName}
            </p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-3" />

        {/* Nav */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "border-l-2 border-[var(--color-primary)] bg-white font-medium text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-white/60",
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-[var(--color-border)] pt-3" />

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={16} />
          Вийти
        </button>
      </aside>

      {/* Mobile tabs */}
      <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] pb-3 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-bg-warm)] text-[var(--color-text-secondary)]",
              )}
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
