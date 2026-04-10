"use client";

import Link from "next/link";
import { type ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Award,
  Building2,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  GitMerge,
  HeadphonesIcon,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Package2,
  Search,
  Send,
  Settings,
  UserCircle2,
  Users,
  Wrench,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { AdminLanguageSwitcher } from "./admin-language-switcher";

type NavCounts = {
  unreadMessages: number;
  newInquiries: number;
  unreadSupport: number;
  newDeals: number;
  unreadDealMessages: number;
};

type AdminSidebarProps = {
  collapsed: boolean;
  counts: NavCounts;
  onToggle: () => void;
  onOpenPalette: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badgeKey?: keyof NavCounts;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "CRM",
    items: [
      { href: "/admin/messages",  label: "Повідомлення", icon: MessageSquare,  badgeKey: "unreadDealMessages" },
      { href: "/admin/pipeline",  label: "Pipeline",     icon: GitMerge,       badgeKey: "newDeals" },
      { href: "/admin/contacts",  label: "Контакти",     icon: Users },
    ],
  },
  {
    title: "Старе (legacy)",
    items: [
      { href: "/admin/inbox",     label: "Inbox",        icon: Mail,           badgeKey: "unreadMessages" },
      { href: "/admin/inquiries", label: "Заявки",       icon: Mail,           badgeKey: "newInquiries"  },
      { href: "/admin/orders",    label: "Замовлення",   icon: Package },
      { href: "/admin/clients",   label: "Клієнти",      icon: Users },
      { href: "/admin/support",   label: "Підтримка",    icon: HeadphonesIcon, badgeKey: "unreadSupport" },
    ],
  },
  {
    title: "Каталог",
    items: [
      { href: "/admin/products", label: "Продукти",       icon: Package2 },
      { href: "/admin/services", label: "Послуги",         icon: Wrench },
      { href: "/admin/pricing",  label: "Ціноутворення",  icon: Calculator },
    ],
  },
  {
    title: "Контент",
    items: [
      { href: "/admin/blog",         label: "Блог",        icon: FileText },
      { href: "/admin/faq",          label: "FAQ",         icon: HelpCircle },
      { href: "/admin/certificates", label: "Сертифікати", icon: Award },
      { href: "/admin/company",      label: "Компанія",    icon: Building2 },
    ],
  },
  {
    title: "Система",
    items: [
      { href: "/admin/wishlist",   label: "Списки бажань", icon: Heart },
      { href: "/admin/newsletter", label: "Розсилка",      icon: Send },
      { href: "/admin/audit-log",  label: "Журнал",        icon: ClipboardList },
      { href: "/admin/settings",   label: "Налаштування",  icon: Settings },
    ],
  },
];

function NavLink({
  item,
  collapsed,
  pathname,
  badgeValue,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  badgeValue?: number;
}) {
  const isRoot = item.href === "/admin";
  const isActive = isRoot
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
        isActive
          ? "bg-white/15 text-[color:var(--color-on-primary)]"
          : "text-[color:var(--color-on-primary-muted)] hover:bg-white/10 hover:text-[color:var(--color-on-primary)]",
      )}
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && badgeValue && badgeValue > 0 ? (
        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
          {badgeValue > 99 ? "99+" : badgeValue}
        </span>
      ) : null}
      {collapsed && badgeValue && badgeValue > 0 ? (
        <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-red-500" />
      ) : null}
    </Link>
  );
}

export function AdminSidebar({ collapsed, counts, onToggle, onOpenPalette }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("admin");

  const onSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 252 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[var(--color-primary-900)] text-[color:var(--color-on-primary)] md:flex"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-3">
        {!collapsed ? (
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[color:var(--color-on-primary)] transition hover:opacity-80"
            title={t("sidebar.backToSite")}
          >
            <div className="rounded-lg bg-white/10 p-2">
              <Wrench size={16} />
            </div>
            <span className="truncate text-sm font-semibold">Svitlytsya Admin</span>
          </Link>
        ) : (
          <Link href="/" className="mx-auto" title={t("sidebar.backToSite")}>
            <div className="rounded-lg bg-white/10 p-2 text-[color:var(--color-on-primary)]">
              <Wrench size={16} />
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md p-1.5 text-[color:var(--color-on-primary-muted)] hover:bg-white/10 hover:text-[color:var(--color-on-primary)]"
          aria-label={collapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Back to site */}
      {!collapsed && (
        <div className="px-3 pt-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-[color:var(--color-on-primary-muted)] transition hover:bg-white/10 hover:text-[color:var(--color-on-primary)]"
          >
            <ExternalLink size={13} />
            {t("sidebar.backToSite")}
          </Link>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2">
        <button
          type="button"
          onClick={onOpenPalette}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[color:var(--color-on-primary-muted)] transition hover:bg-white/10 hover:text-[color:var(--color-on-primary)]",
            collapsed ? "justify-center px-2" : "",
          )}
          title={collapsed ? `${t("sidebar.search")} (Ctrl/Cmd+K)` : undefined}
        >
          <Search size={14} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{t("sidebar.search")}</span>
              <kbd className="rounded border border-white/20 px-1 text-[10px] text-[color:var(--color-on-primary-faint)]">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav sections */}
      <nav className="admin-scrollbar flex-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={cn(si > 0 && "mt-4")}>
            {section.title && !collapsed && (
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {section.title}
              </p>
            )}
            {si > 0 && collapsed && <div className="mb-2 h-px bg-white/10" />}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  badgeValue={item.badgeKey ? counts[item.badgeKey] : 0}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            "mb-2 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-[color:var(--color-on-primary-muted)]",
            collapsed ? "justify-center px-2" : "",
          )}
        >
          <UserCircle2 size={16} className="shrink-0" />
          {!collapsed && <span className="text-sm">{t("sidebar.owner")}</span>}
        </div>
        <div className={cn("mb-2", collapsed ? "flex justify-center" : "")}>
          <AdminLanguageSwitcher collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className={cn(
            "w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-[color:var(--color-on-primary-muted)] transition hover:bg-white/10 hover:text-[color:var(--color-on-primary)]",
            collapsed ? "px-2 text-xs" : "",
          )}
        >
          {collapsed ? "↩" : t("sidebar.signOut")}
        </button>
      </div>
    </motion.aside>
  );
}
