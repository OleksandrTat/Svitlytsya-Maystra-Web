"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MobileNavCounts = {
  unreadMessages: number;
  newInquiries: number;
};

type TabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: keyof MobileNavCounts;
};

const TAB_ITEMS: TabItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Головна" },
  { href: "/admin/inquiries", icon: Mail, label: "Заявки", badgeKey: "newInquiries" },
  { href: "/admin/orders", icon: Package, label: "Замовлення" },
  { href: "/admin/inbox", icon: MessageSquare, label: "Чат", badgeKey: "unreadMessages" },
  { href: "/admin/clients", icon: Users, label: "Клієнти" },
];

export function MobileBottomNav({ counts }: { counts: MobileNavCounts }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-white/95 pb-safe backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {TAB_ITEMS.map((item) => {
          const isRoot = item.href === "/admin";
          const isActive = isRoot
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.badgeKey ? counts[item.badgeKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-1 text-[10px]",
                isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]",
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              <span className="font-medium">{item.label}</span>
              {badge > 0 ? (
                <span className="absolute right-3 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
