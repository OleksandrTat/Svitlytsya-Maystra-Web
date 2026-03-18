"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, ChevronDown, ChevronRight, Mail,
  Search, ShoppingBag, Star, TrendingUp, User, Users, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Client = {
  id: string;
  display_name?: string | null;
  last_seen_at: string;
  created_at: string;
  orders_count: number;
  account_types: string[];
};

type Props = { clients: Client[] };

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const MS_DAY = 86400000;

type ActivityLevel = "hot" | "warm" | "cool" | "ghost";

function getLevel(last: string): ActivityLevel {
  const d = (Date.now() - new Date(last).getTime()) / MS_DAY;
  if (d <= 7)  return "hot";
  if (d <= 30) return "warm";
  if (d <= 90) return "cool";
  return "ghost";
}

const LEVEL_META: Record<ActivityLevel, { label: string; color: string; bg: string; dot: string }> = {
  hot:   { label: "Активний",   color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-400 animate-pulse" },
  warm:  { label: "Теплий",     color: "text-amber-700",   bg: "bg-amber-100",   dot: "bg-amber-400" },
  cool:  { label: "Холодний",   color: "text-sky-700",     bg: "bg-sky-100",     dot: "bg-sky-400" },
  ghost: { label: "Неактивний", color: "text-zinc-500",    bg: "bg-zinc-100",    dot: "bg-zinc-300" },
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
}

const GRAD_POOL = [
  "from-sky-400 to-sky-600", "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600", "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600", "from-cyan-400 to-cyan-600",
  "from-indigo-400 to-indigo-600", "from-teal-400 to-teal-600",
];

function avatarGrad(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return GRAD_POOL[Math.abs(h) % GRAD_POOL.length]!;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

/* ─── Row ─────────────────────────────────────────────────────────────────── */
function ClientRow({ client, rank, expanded, onToggle }: {
  client: Client; rank: number; expanded: boolean; onToggle: () => void;
}) {
  const level = getLevel(client.last_seen_at);
  const meta = LEVEL_META[level];
  const name = client.display_name ?? "Без імені";
  const isBuyer = client.orders_count > 0;
  const isSub = client.account_types.includes("email_subscriber");

  return (
    <>
      <motion.tr layout
        className={cn("group cursor-pointer border-b border-[var(--color-border)]/60 transition-colors",
          expanded ? "bg-[var(--color-primary-100)]/60" : "hover:bg-[var(--color-surface)]")}
        onClick={onToggle}>
        {/* rank */}
        <td className="w-10 px-3 py-3 text-center">
          <span className="font-mono text-xs text-[var(--color-text-secondary)]">{rank}</span>
        </td>

        {/* avatar + name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm", avatarGrad(client.id))}>
              {initials(name)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{name}</p>
                {isSub && <Star size={10} className="text-amber-500" />}
              </div>
              <p className="font-mono text-[10px] text-[var(--color-text-secondary)]">{client.id.slice(0, 8)}…</p>
            </div>
          </div>
        </td>

        {/* activity */}
        <td className="hidden px-4 py-3 md:table-cell">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", meta.bg, meta.color)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
        </td>

        {/* orders */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={13} className={isBuyer ? "text-[var(--color-primary)]" : "text-[var(--color-border)]"} />
            <span className={cn("text-sm font-semibold", isBuyer ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]")}>
              {client.orders_count}
            </span>
          </div>
        </td>

        {/* segments */}
        <td className="hidden px-4 py-3 xl:table-cell">
          <div className="flex flex-wrap gap-1">
            {isBuyer && <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">Покупець</span>}
            {isSub && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">Підписник</span>}
            {!isBuyer && <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-500">Лід</span>}
          </div>
        </td>

        {/* last seen */}
        <td className="hidden px-4 py-3 text-xs text-[var(--color-text-secondary)] lg:table-cell">
          {formatDate(client.last_seen_at)}
        </td>

        {/* actions */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <Link href={`/admin/clients/${client.id}`} onClick={(e) => e.stopPropagation()}
              className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] opacity-0 transition group-hover:opacity-100 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              <ArrowUpRight size={12} />
            </Link>
            <ChevronRight size={14} className={cn("text-[var(--color-text-secondary)] transition-transform duration-200", expanded && "rotate-90")} />
          </div>
        </td>
      </motion.tr>

      {/* expanded micro-profile */}
      <AnimatePresence>
        {expanded && (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <td colSpan={7} className="bg-[var(--color-primary-100)]/60 px-4 pb-4 pt-1">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  { icon: <ShoppingBag size={12} />, label: "Замовлень",     value: String(client.orders_count) },
                  { icon: <Mail size={12} />,         label: "Підписник",     value: isSub ? "Так" : "Ні" },
                  { icon: <User size={12} />,         label: "З нами з",      value: formatDate(client.created_at) },
                  { icon: <Activity size={12} />,     label: "Активн.",       value: formatDate(client.last_seen_at) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      {item.icon}
                      <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Link href={`/admin/clients/${client.id}`}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white">
                  Відкрити профіль <ArrowUpRight size={11} />
                </Link>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main list ───────────────────────────────────────────────────────────── */
export function ClientsList({ clients }: Props) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<"all" | "buyers" | "leads" | "hot">("all");
  const [sort, setSort] = useState<"lastSeen" | "orders" | "created">("lastSeen");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = [...clients];

    if (q) list = list.filter((c) => (c.display_name ?? "").toLowerCase().includes(q) || c.id.includes(q));
    if (segment === "buyers") list = list.filter((c) => c.orders_count > 0);
    if (segment === "leads")  list = list.filter((c) => c.orders_count === 0);
    if (segment === "hot")    list = list.filter((c) => getLevel(c.last_seen_at) === "hot");

    if (sort === "orders")  list.sort((a, b) => b.orders_count - a.orders_count);
    else if (sort === "created") list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else list.sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at));

    return list;
  }, [clients, query, segment, sort]);

  const stats = useMemo(() => ({
    total:   clients.length,
    hot:     clients.filter((c) => getLevel(c.last_seen_at) === "hot").length,
    buyers:  clients.filter((c) => c.orders_count > 0).length,
    subs:    clients.filter((c) => c.account_types.includes("email_subscriber")).length,
    leads:   clients.filter((c) => c.orders_count === 0).length,
    active:  clients.filter((c) => getLevel(c.last_seen_at) !== "ghost").length,
  }), [clients]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {[
          { label: "Всього",      value: stats.total,  icon: <Users size={13} />,        cls: "bg-white border-[var(--color-border)]",        txt: "text-[var(--color-text-primary)]" },
          { label: "Активних",   value: stats.active,  icon: <Activity size={13} />,     cls: "bg-emerald-50 border-emerald-200",             txt: "text-emerald-700" },
          { label: "🔥 Гарячих", value: stats.hot,     icon: <TrendingUp size={13} />,   cls: "bg-red-50 border-red-200",                     txt: "text-red-700" },
          { label: "Покупців",   value: stats.buyers,  icon: <ShoppingBag size={13} />,  cls: "bg-sky-50 border-sky-200",                     txt: "text-sky-700" },
          { label: "Підписників",value: stats.subs,    icon: <Mail size={13} />,         cls: "bg-amber-50 border-amber-200",                 txt: "text-amber-700" },
          { label: "Лідів",      value: stats.leads,   icon: <Zap size={13} />,          cls: "bg-violet-50 border-violet-200",               txt: "text-violet-700" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-3", s.cls)}>
            <div className={cn("flex items-center gap-1.5", s.txt)}>
              {s.icon}
              <p className="text-[10px] font-medium">{s.label}</p>
            </div>
            <p className={cn("mt-1 text-2xl font-bold", s.txt)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2">
          <Search size={14} className="text-[var(--color-text-secondary)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ім'я або ID клієнта..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]" />
        </div>

        {/* segments */}
        <div className="flex overflow-hidden rounded-xl border border-[var(--color-border)]">
          {[
            { key: "all",    label: `Всі (${stats.total})` },
            { key: "hot",    label: "🔥 Гарячі" },
            { key: "buyers", label: "Покупці" },
            { key: "leads",  label: "Ліди" },
          ].map((s) => (
            <button key={s.key} type="button" onClick={() => setSegment(s.key as typeof segment)}
              className={cn("px-3 py-2 text-xs font-medium transition",
                segment === s.key ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]")}>
              {s.label}
            </button>
          ))}
        </div>

        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm">
          <option value="lastSeen">Активність</option>
          <option value="orders">Замовлення</option>
          <option value="created">Реєстрація</option>
        </select>

        <span className="ml-auto text-xs text-[var(--color-text-secondary)]">{filtered.length} клієнтів</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                {["", "Клієнт", "Активність", "Замовлення", "Сегменти", "Остання активн.", ""].map((h) => (
                  <th key={h} className={cn("px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]",
                    h === "" && "w-10",
                    h === "Активність" && "hidden md:table-cell",
                    h === "Сегменти" && "hidden xl:table-cell",
                    h === "Остання активн." && "hidden lg:table-cell")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.map((client, i) => (
                  <ClientRow key={client.id} client={client} rank={i + 1}
                    expanded={expandedId === client.id}
                    onToggle={() => setExpandedId(expandedId === client.id ? null : client.id)} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users size={32} className="text-[var(--color-border)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">Клієнтів не знайдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
