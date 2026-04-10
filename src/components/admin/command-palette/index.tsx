"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Building2,
  Calculator,
  ClipboardList,
  FileText,
  HeadphonesIcon,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Package2,
  Plus,
  Search,
  Send,
  Settings,
  User,
  Users,
  Wrench,
} from "lucide-react";

type SearchResultIcon = "package" | "user" | "mail";

type SearchResult = {
  id: string;
  type: "order" | "client" | "inquiry";
  icon: SearchResultIcon;
  title: string;
  meta: string;
  href: string;
};

type StaticCommand = {
  id: string;
  title: string;
  meta: string;
  href: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  isCreate?: boolean;
};

type CommandGroup = {
  heading: string;
  commands: StaticCommand[];
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const iconMap: Record<SearchResultIcon, ComponentType<{ size?: number; className?: string }>> = {
  package: Package,
  user: User,
  mail: Mail,
};

const COMMAND_GROUPS: CommandGroup[] = [
  {
    heading: "Головне",
    commands: [
      { id: "dashboard", title: "Dashboard",       meta: "Огляд метрик та активності",  href: "/admin",            Icon: LayoutDashboard },
      { id: "settings",  title: "Налаштування",    meta: "Системні параметри",           href: "/admin/settings",   Icon: Settings },
      { id: "audit",     title: "Журнал аудиту",   meta: "Лог дій адміністраторів",      href: "/admin/audit-log",  Icon: ClipboardList },
    ],
  },
  {
    heading: "Клієнти",
    commands: [
      { id: "inbox",     title: "Повідомлення",    meta: "Inbox замовлень",              href: "/admin/inbox",      Icon: MessageSquare },
      { id: "inquiries", title: "Заявки",           meta: "Нові звернення клієнтів",      href: "/admin/inquiries",  Icon: Mail },
      { id: "orders",    title: "Замовлення",       meta: "Kanban та список замовлень",   href: "/admin/orders",     Icon: Package },
      { id: "clients",   title: "Клієнти",          meta: "Клієнтська база та картки",    href: "/admin/clients",    Icon: Users },
      { id: "support",   title: "Підтримка",        meta: "Тікети підтримки",             href: "/admin/support",    Icon: HeadphonesIcon },
      { id: "wishlist",  title: "Списки бажань",    meta: "Збережені товари клієнтів",    href: "/admin/wishlist",   Icon: Heart },
    ],
  },
  {
    heading: "Каталог",
    commands: [
      { id: "products",     title: "Продукти",         meta: "Каталог виробів",              href: "/admin/products",       Icon: Package2 },
      { id: "new-product",  title: "Новий продукт",    meta: "Створити виріб",               href: "/admin/products/new",   Icon: Plus, isCreate: true },
      { id: "services",     title: "Послуги",           meta: "Перелік послуг",               href: "/admin/services",       Icon: Wrench },
      { id: "new-service",  title: "Нова послуга",     meta: "Створити послугу",             href: "/admin/services/new",   Icon: Plus, isCreate: true },
      { id: "pricing",      title: "Ціноутворення",    meta: "Формули та пресети",           href: "/admin/pricing",        Icon: Calculator },
      { id: "new-formula",  title: "Нова формула",     meta: "Створити формулу ціни",        href: "/admin/pricing/new",    Icon: Plus, isCreate: true },
    ],
  },
  {
    heading: "Контент",
    commands: [
      { id: "blog",         title: "Блог",             meta: "Статті та новини",             href: "/admin/blog",           Icon: FileText },
      { id: "new-post",     title: "Нова стаття",      meta: "Написати статтю",              href: "/admin/blog/new",       Icon: Plus, isCreate: true },
      { id: "faq",          title: "FAQ",              meta: "Питання та відповіді",         href: "/admin/faq",            Icon: HelpCircle },
      { id: "new-faq",      title: "Нове FAQ питання", meta: "Додати питання",              href: "/admin/faq/new",        Icon: Plus, isCreate: true },
      { id: "certificates", title: "Сертифікати",      meta: "Нагороди та документи",        href: "/admin/certificates",   Icon: Award },
      { id: "company",      title: "Компанія",         meta: "Про нас, контакти, команда",  href: "/admin/company",        Icon: Building2 },
      { id: "newsletter",   title: "Розсилка",         meta: "Email-кампанії",               href: "/admin/newsletter",     Icon: Send },
    ],
  },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) { setSearch(""); setResults([]); setLoading(false); }
  }, [open]);

  useEffect(() => {
    if (!open || search.trim().length < 2) { setResults([]); setLoading(false); return; }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(search)}`, { signal: controller.signal });
        const data = (await response.json()) as SearchResult[];
        setResults(response.ok && Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => { controller.abort(); clearTimeout(timeoutId); };
  }, [open, search]);

  const isSearchMode = search.trim().length >= 2;

  // Filter static commands by search
  const filteredGroups = useMemo(() => {
    if (!isSearchMode) return COMMAND_GROUPS;
    const q = search.toLowerCase();
    return COMMAND_GROUPS.map((g) => ({
      ...g,
      commands: g.commands.filter(
        (c) => c.title.toLowerCase().includes(q) || c.meta.toLowerCase().includes(q),
      ),
    })).filter((g) => g.commands.length > 0);
  }, [search, isSearchMode]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

          <motion.div
            className="relative mx-auto mt-[12vh] w-[min(96vw,720px)]"
            initial={{ scale: 0.97, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: -10 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <Command className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
                <Search size={16} className="text-[var(--color-text-secondary)]" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Пошук сторінок, замовлень, клієнтів..."
                  className="w-full border-none bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
                />
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
                >
                  Esc
                </button>
              </div>

              <Command.List className="max-h-[480px] overflow-y-auto p-2">
                {loading && (
                  <p className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">Пошук...</p>
                )}

                {/* DB search results */}
                {isSearchMode && !loading && results.length > 0 && (
                  <Command.Group heading="Результати пошуку" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-zinc-400">
                    {results.map((result) => {
                      const Icon = iconMap[result.icon];
                      return (
                        <Command.Item
                          key={`${result.type}-${result.id}`}
                          value={`${result.title} ${result.meta}`}
                          onSelect={() => handleSelect(result.href)}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 data-[selected=true]:bg-[var(--color-primary-100)]"
                        >
                          <Icon size={16} className="text-[var(--color-text-secondary)]" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{result.title}</p>
                            <p className="truncate text-xs text-[var(--color-text-secondary)]">{result.meta}</p>
                          </div>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                )}

                {isSearchMode && !loading && results.length === 0 && filteredGroups.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-[var(--color-text-secondary)]">Нічого не знайдено</p>
                )}

                {/* Static nav commands */}
                {filteredGroups.map((group) => (
                  <Command.Group
                    key={group.heading}
                    heading={group.heading}
                    className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-zinc-400"
                  >
                    {group.commands.map((command) => (
                      <Command.Item
                        key={command.id}
                        value={`${command.title} ${command.meta}`}
                        onSelect={() => handleSelect(command.href)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 data-[selected=true]:bg-[var(--color-primary-100)]"
                      >
                        <command.Icon
                          size={16}
                          className={command.isCreate ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"}
                        />
                        <div>
                          <p className={`text-sm font-medium ${command.isCreate ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]"}`}>
                            {command.title}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{command.meta}</p>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
