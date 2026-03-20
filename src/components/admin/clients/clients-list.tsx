"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  ChevronRight,
  Search,
  ShoppingBag,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Client = {
  id: string;
  display_name: string | null;
  last_seen_at: string;
  created_at: string;
  orders_count: number;
  account_types: string[];
};

type ClientsListProps = {
  clients: Client[];
};

const MS_DAY = 86_400_000;

type ActivityLevel = "hot" | "warm" | "cool" | "ghost";

const LEVEL_META: Record<
  ActivityLevel,
  { label: string; color: string; background: string; dot: string }
> = {
  hot: {
    label: "Активний",
    color: "text-emerald-700",
    background: "bg-emerald-100",
    dot: "bg-emerald-400 animate-pulse",
  },
  warm: {
    label: "Теплий",
    color: "text-amber-700",
    background: "bg-amber-100",
    dot: "bg-amber-400",
  },
  cool: {
    label: "Холодний",
    color: "text-sky-700",
    background: "bg-sky-100",
    dot: "bg-sky-400",
  },
  ghost: {
    label: "Неактивний",
    color: "text-zinc-500",
    background: "bg-zinc-100",
    dot: "bg-zinc-300",
  },
};

const GRADIENT_POOL = [
  "from-sky-400 to-sky-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-cyan-400 to-cyan-600",
  "from-indigo-400 to-indigo-600",
  "from-teal-400 to-teal-600",
];

function getActivityLevel(lastSeenAt: string): ActivityLevel {
  const days = (Date.now() - new Date(lastSeenAt).getTime()) / MS_DAY;
  if (days <= 7) {
    return "hot";
  }
  if (days <= 30) {
    return "warm";
  }
  if (days <= 90) {
    return "cool";
  }
  return "ghost";
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((word) => word[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function getAvatarGradient(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = id.charCodeAt(index) + ((hash << 5) - hash);
  }

  return GRADIENT_POOL[Math.abs(hash) % GRADIENT_POOL.length]!;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ClientRow({
  client,
  expanded,
  onToggle,
  rank,
}: {
  client: Client;
  expanded: boolean;
  onToggle: () => void;
  rank: number;
}) {
  const level = getActivityLevel(client.last_seen_at);
  const levelMeta = LEVEL_META[level];
  const name = client.display_name ?? "Без імені";
  const isBuyer = client.orders_count > 0;

  return (
    <>
      <motion.tr
        layout
        className={cn(
          "group cursor-pointer border-b border-[var(--color-border)]/60 transition-colors",
          expanded ? "bg-[var(--color-primary-100)]/60" : "hover:bg-[var(--color-surface)]",
        )}
        onClick={onToggle}
      >
        <td className="w-10 px-3 py-3 text-center">
          <span className="font-mono text-xs text-[var(--color-text-secondary)]">{rank}</span>
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm",
                getAvatarGradient(client.id),
              )}
            >
              {getInitials(name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{name}</p>
              <p className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                {client.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </td>

        <td className="hidden px-4 py-3 md:table-cell">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              levelMeta.background,
              levelMeta.color,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", levelMeta.dot)} />
            {levelMeta.label}
          </span>
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <ShoppingBag
              size={13}
              className={isBuyer ? "text-[var(--color-primary)]" : "text-[var(--color-border)]"}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                isBuyer ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]",
              )}
            >
              {client.orders_count}
            </span>
          </div>
        </td>

        <td className="hidden px-4 py-3 xl:table-cell">
          <div className="flex flex-wrap gap-1">
            {isBuyer ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                Покупець
              </span>
            ) : (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-500">
                Лід
              </span>
            )}
          </div>
        </td>

        <td className="hidden px-4 py-3 text-xs text-[var(--color-text-secondary)] lg:table-cell">
          {formatDate(client.last_seen_at)}
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/admin/clients/${client.id}`}
              onClick={(event) => event.stopPropagation()}
              className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] opacity-0 transition group-hover:opacity-100 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <ArrowUpRight size={12} />
            </Link>
            <ChevronRight
              size={14}
              className={cn(
                "text-[var(--color-text-secondary)] transition-transform duration-200",
                expanded ? "rotate-90" : "",
              )}
            />
          </div>
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded ? (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <td colSpan={7} className="bg-[var(--color-primary-100)]/60 px-4 pb-4 pt-1">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  {
                    icon: <ShoppingBag size={12} />,
                    label: "Замовлень",
                    value: String(client.orders_count),
                  },
                  {
                    icon: <User size={12} />,
                    label: "Профіль",
                    value: client.display_name ? "Заповнений" : "Базовий",
                  },
                  {
                    icon: <User size={12} />,
                    label: "З нами з",
                    value: formatDate(client.created_at),
                  },
                  {
                    icon: <Activity size={12} />,
                    label: "Активність",
                    value: formatDate(client.last_seen_at),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[var(--color-border)] bg-white p-3"
                  >
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      {item.icon}
                      <span className="text-[10px] font-medium uppercase tracking-wide">
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex gap-2">
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Відкрити профіль
                  <ArrowUpRight size={11} />
                </Link>
              </div>
            </td>
          </motion.tr>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function ClientsList({ clients }: ClientsListProps) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<"all" | "buyers" | "leads" | "hot">("all");
  const [sort, setSort] = useState<"lastSeen" | "orders" | "created">("lastSeen");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    let nextClients = [...clients];

    if (normalizedQuery) {
      nextClients = nextClients.filter((client) => {
        const name = (client.display_name ?? "").toLowerCase();
        return name.includes(normalizedQuery) || client.id.includes(normalizedQuery);
      });
    }

    if (segment === "buyers") {
      nextClients = nextClients.filter((client) => client.orders_count > 0);
    } else if (segment === "leads") {
      nextClients = nextClients.filter((client) => client.orders_count === 0);
    } else if (segment === "hot") {
      nextClients = nextClients.filter((client) => getActivityLevel(client.last_seen_at) === "hot");
    }

    if (sort === "orders") {
      nextClients.sort((left, right) => right.orders_count - left.orders_count);
    } else if (sort === "created") {
      nextClients.sort((left, right) => right.created_at.localeCompare(left.created_at));
    } else {
      nextClients.sort((left, right) => right.last_seen_at.localeCompare(left.last_seen_at));
    }

    return nextClients;
  }, [clients, query, segment, sort]);

  const stats = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter((client) => getActivityLevel(client.last_seen_at) !== "ghost").length,
      hot: clients.filter((client) => getActivityLevel(client.last_seen_at) === "hot").length,
      buyers: clients.filter((client) => client.orders_count > 0).length,
      leads: clients.filter((client) => client.orders_count === 0).length,
    }),
    [clients],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
        {[
          {
            label: "Всього",
            value: stats.total,
            icon: <Users size={13} />,
            className: "bg-white border-[var(--color-border)]",
            textClassName: "text-[var(--color-text-primary)]",
          },
          {
            label: "Активних",
            value: stats.active,
            icon: <Activity size={13} />,
            className: "bg-emerald-50 border-emerald-200",
            textClassName: "text-emerald-700",
          },
          {
            label: "Гарячих",
            value: stats.hot,
            icon: <TrendingUp size={13} />,
            className: "bg-red-50 border-red-200",
            textClassName: "text-red-700",
          },
          {
            label: "Покупців",
            value: stats.buyers,
            icon: <ShoppingBag size={13} />,
            className: "bg-sky-50 border-sky-200",
            textClassName: "text-sky-700",
          },
          {
            label: "Лідів",
            value: stats.leads,
            icon: <Zap size={13} />,
            className: "bg-violet-50 border-violet-200",
            textClassName: "text-violet-700",
          },
        ].map((item) => (
          <div key={item.label} className={cn("rounded-2xl border p-3", item.className)}>
            <div className={cn("flex items-center gap-1.5", item.textClassName)}>
              {item.icon}
              <p className="text-[10px] font-medium">{item.label}</p>
            </div>
            <p className={cn("mt-1 text-2xl font-bold", item.textClassName)}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2">
          <Search size={14} className="text-[var(--color-text-secondary)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ім'я або ID клієнта..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
          />
        </div>

        <div className="flex overflow-hidden rounded-xl border border-[var(--color-border)]">
          {[
            { key: "all", label: `Всі (${stats.total})` },
            { key: "hot", label: "Гарячі" },
            { key: "buyers", label: "Покупці" },
            { key: "leads", label: "Ліди" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSegment(item.key as typeof segment)}
              className={cn(
                "px-3 py-2 text-xs font-medium transition",
                segment === item.key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
          className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
        >
          <option value="lastSeen">Активність</option>
          <option value="orders">Замовлення</option>
          <option value="created">Реєстрація</option>
        </select>

        <span className="ml-auto text-xs text-[var(--color-text-secondary)]">
          {filteredClients.length} клієнтів
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                {[
                  "",
                  "Клієнт",
                  "Активність",
                  "Замовлення",
                  "Сегмент",
                  "Остання активн.",
                  "",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={cn(
                      "px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]",
                      heading === "" ? "w-10" : "",
                      heading === "Активність" ? "hidden md:table-cell" : "",
                      heading === "Сегмент" ? "hidden xl:table-cell" : "",
                      heading === "Остання активн." ? "hidden lg:table-cell" : "",
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredClients.map((client, index) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    rank={index + 1}
                    expanded={expandedId === client.id}
                    onToggle={() => setExpandedId(expandedId === client.id ? null : client.id)}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users size={32} className="text-[var(--color-border)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">Клієнтів не знайдено</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
