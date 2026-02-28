"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calculator,
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  PenSquare,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

type SearchResultIcon = "package" | "user" | "mail" | "pen";

type SearchResult = {
  id: string;
  type: "order" | "client" | "inquiry" | "cultural";
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
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const iconMap: Record<SearchResultIcon, ComponentType<{ size?: number; className?: string }>> = {
  package: Package,
  user: User,
  mail: Mail,
  pen: PenSquare,
};

const staticCommands: StaticCommand[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    meta: "Огляд метрик та активності",
    href: "/admin",
    Icon: LayoutDashboard,
  },
  {
    id: "orders",
    title: "Замовлення",
    meta: "Kanban та список замовлень",
    href: "/admin/orders",
    Icon: Package,
  },
  {
    id: "inquiries",
    title: "Заявки",
    meta: "Нові звернення клієнтів",
    href: "/admin/inquiries",
    Icon: Mail,
  },
  {
    id: "inbox",
    title: "Inbox",
    meta: "Повідомлення по замовленнях",
    href: "/admin/inbox",
    Icon: MessageSquare,
  },
  {
    id: "clients",
    title: "Клієнти",
    meta: "Клієнтська база та картки",
    href: "/admin/clients",
    Icon: Users,
  },
  {
    id: "pricing",
    title: "Ціноутворення",
    meta: "Формули та presets",
    href: "/admin/pricing",
    Icon: Calculator,
  },
  {
    id: "blog",
    title: "Блог",
    meta: "Статті компанії",
    href: "/admin/blog",
    Icon: PenSquare,
  },
  {
    id: "cultural",
    title: "Cultural blog",
    meta: "Cultural posts and moderation",
    href: "/admin/cultural",
    Icon: PenSquare,
  },
  {
    id: "projects",
    title: "Каталог проєктів",
    meta: "Проєкти та NDA рівні",
    href: "/admin/projects",
    Icon: FileText,
  },
  {
    id: "settings",
    title: "Налаштування",
    meta: "Системні параметри",
    href: "/admin/settings",
    Icon: Settings,
  },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || search.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(search)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setResults([]);
          return;
        }
        const data = (await response.json()) as SearchResult[];
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [open, search]);

  const isSearchMode = search.trim().length >= 2;
  const visibleStaticCommands = useMemo(() => {
    if (isSearchMode) {
      return [];
    }
    return staticCommands;
  }, [isSearchMode]);

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
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

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
                  placeholder="Знайти замовлення, клієнта, заявку..."
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

              <Command.List className="max-h-[420px] overflow-y-auto p-2">
                {loading ? (
                  <p className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">Пошук...</p>
                ) : null}

                {!loading && isSearchMode && results.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                    Нічого не знайдено
                  </p>
                ) : null}

                {!isSearchMode &&
                  visibleStaticCommands.map((command) => (
                    <Command.Item
                      key={command.id}
                      value={command.title}
                      onSelect={() => handleSelect(command.href)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 data-[selected=true]:bg-[var(--color-primary-100)]"
                    >
                      <command.Icon size={16} className="text-[var(--color-text-secondary)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {command.title}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{command.meta}</p>
                      </div>
                    </Command.Item>
                  ))}

                {isSearchMode &&
                  results.map((result) => {
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
                          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                            {result.title}
                          </p>
                          <p className="truncate text-xs text-[var(--color-text-secondary)]">
                            {result.meta}
                          </p>
                        </div>
                      </Command.Item>
                    );
                  })}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
