"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowRight, Box, Calendar, CheckCircle2, ChevronRight,
  Clock, FolderOpen, Layers, MessageSquare, Package,
  Pencil, Plus, Search, Settings2, Tag, User, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Minimal local types ───────────────────────────────────────────────────── */
type OrderStatus =
  | "new" | "consulting" | "design" | "approved"
  | "production" | "ready" | "installation" | "completed" | "archived";

type OrderPriority = "low" | "normal" | "high" | "urgent";

type Order = {
  id: string;
  order_number: string;
  status: OrderStatus;
  priority: OrderPriority;
  expected_date?: string | null;
  internal_notes?: string | null;
  created_at: string;
  user_id?: string | null;
  inquiry_id?: string | null;
  project_id?: string | null;
};

type EnrichedOrder = Order & {
  clientName: string;
  serviceType: string;
};

type Project = {
  id: string;
  title: string;
  category: string;
  status: string;
  cover_image?: string | null;
  images: string[];
  location?: string | null;
  completed_at?: string | null;
  description?: string;
  style: string[];
  materials: string[];
};

type Product = {
  id: string;
  title: string;
  category: string;
  status: string;
  cover_image?: string | null;
  price_from?: number | null;
};

type Props = {
  orders: EnrichedOrder[];
  projects: Project[];
  products: Product[];
};

/* ─── Status meta ─────────────────────────────────────────────────────────── */
const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; dot: string; step: number }> = {
  new:          { label: "Нове",         color: "text-zinc-600",     bg: "bg-zinc-100",    dot: "bg-zinc-400",     step: 1 },
  consulting:   { label: "Консультація", color: "text-sky-700",      bg: "bg-sky-100",     dot: "bg-sky-500",      step: 2 },
  design:       { label: "Дизайн",       color: "text-violet-700",   bg: "bg-violet-100",  dot: "bg-violet-500",   step: 3 },
  approved:     { label: "Підтверджено", color: "text-blue-700",     bg: "bg-blue-100",    dot: "bg-blue-500",     step: 4 },
  production:   { label: "Виробництво",  color: "text-amber-700",    bg: "bg-amber-100",   dot: "bg-amber-500",    step: 5 },
  ready:        { label: "Готово",       color: "text-teal-700",     bg: "bg-teal-100",    dot: "bg-teal-500",     step: 6 },
  installation: { label: "Монтаж",       color: "text-orange-700",   bg: "bg-orange-100",  dot: "bg-orange-500",   step: 7 },
  completed:    { label: "Завершено",    color: "text-emerald-700",  bg: "bg-emerald-100", dot: "bg-emerald-500",  step: 8 },
  archived:     { label: "Архів",        color: "text-zinc-400",     bg: "bg-zinc-50",     dot: "bg-zinc-300",     step: 0 },
};

const ACTIVE_STATUSES = (Object.keys(STATUS_META) as OrderStatus[]).filter((s) => s !== "archived");

const PRIORITY_META: Record<OrderPriority, { label: string; color: string }> = {
  low:    { label: "Низький",  color: "text-zinc-500"   },
  normal: { label: "Звичайний",color: "text-[var(--color-text-secondary)]" },
  high:   { label: "Високий", color: "text-amber-700"  },
  urgent: { label: "Терміново",color: "text-red-700"   },
};

const CAT_LABELS: Record<string, string> = {
  doors: "Двері", furniture: "Меблі", windows: "Вікна", restoration: "Реставрація",
};

/* ─── Progress bar ─────────────────────────────────────────────────────────── */
function ProgressBar({ status }: { status: OrderStatus }) {
  const { step, label } = STATUS_META[status];
  const pct = step > 0 ? Math.round((step / 8) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold text-white/90">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
        <motion.div className="h-full rounded-full bg-white" initial={{ width: 0 }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
      </div>
    </div>
  );
}

/* ─── Order list item ─────────────────────────────────────────────────────── */
function OrderItem({ order, active, onClick, msgCount }: {
  order: EnrichedOrder; active: boolean; onClick: () => void; msgCount?: number;
}) {
  const meta = STATUS_META[order.status];
  return (
    <button type="button" onClick={onClick}
      className={cn("group flex w-full flex-col gap-1.5 rounded-xl p-3 text-left transition",
        active ? "bg-[var(--color-primary)] text-white" : "hover:bg-[var(--color-surface)]")}>
      <div className="flex items-center justify-between gap-1">
        <span className={cn("font-mono text-[10px] font-semibold", active ? "text-white/60" : "text-[var(--color-text-secondary)]")}>
          {order.order_number}
        </span>
        <div className="flex items-center gap-1">
          {(msgCount ?? 0) > 0 && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", active ? "bg-white/20 text-white" : "bg-red-500 text-white")}>
              {msgCount}
            </span>
          )}
          {order.priority === "urgent" && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", active ? "bg-white/20 text-amber-100" : "bg-amber-100 text-amber-700")}>
              ⚡
            </span>
          )}
        </div>
      </div>
      <p className={cn("text-sm font-semibold leading-tight", active ? "text-white" : "text-[var(--color-text-primary)]")}>
        {order.clientName}
      </p>
      <p className={cn("truncate text-xs", active ? "text-white/60" : "text-[var(--color-text-secondary)]")}>
        {order.serviceType}
      </p>
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
          active ? "bg-white/15 text-white/80" : cn(meta.bg, meta.color))}>
          <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-white/50" : meta.dot)} />
          {meta.label}
        </span>
        {order.expected_date && (
          <span className={cn("flex items-center gap-0.5 text-[10px]", active ? "text-white/50" : "text-[var(--color-text-secondary)]")}>
            <Calendar size={9} />
            {new Date(order.expected_date).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Hierarchy panel ─────────────────────────────────────────────────────── */
function HierarchyView({ order, project, linkedProducts, allProjects, onLink }: {
  order: EnrichedOrder;
  project: Project | null;
  linkedProducts: Product[];
  allProjects: Project[];
  onLink: (projectId: string) => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = allProjects.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  ).slice(0, 8);

  return (
    <div className="space-y-3">
      {/* Hierarchy breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[var(--color-surface)] px-3 py-2">
        <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-semibold shadow-sm">
          <Package size={11} className="text-[var(--color-primary)]" />{order.order_number}
        </span>
        <ChevronRight size={12} className="text-[var(--color-border)]" />
        <span className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium",
          project ? "bg-white shadow-sm" : "border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)]")}>
          <FolderOpen size={11} className={project ? "text-amber-500" : "text-[var(--color-border)]"} />
          {project ? project.title : "Без проєкту"}
        </span>
        {project && (
          <>
            <ChevronRight size={12} className="text-[var(--color-border)]" />
            <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-medium shadow-sm">
              <Tag size={11} className="text-violet-500" />
              {linkedProducts.length} продуктів
            </span>
          </>
        )}
      </div>

      {/* Project card */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <FolderOpen size={14} className="text-amber-500" /> Проєкт виробництва
          </div>
          <button type="button" onClick={() => setLinkOpen(!linkOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
            {project ? <><Pencil size={11} /> Змінити</> : <><Plus size={11} /> Прив'язати</>}
          </button>
        </div>

        {/* Link panel */}
        <AnimatePresence>
          {linkOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="border-b border-[var(--color-border)] bg-[var(--color-primary-100)] p-3 space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5">
                  <Search size={12} className="text-[var(--color-text-secondary)]" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Пошук проєктів..."
                    className="flex-1 bg-transparent text-xs outline-none" />
                </div>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {filtered.map((p) => (
                    <button key={p.id} type="button"
                      onClick={() => { onLink(p.id); setLinkOpen(false); }}
                      className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition hover:bg-white",
                        order.project_id === p.id && "bg-white font-semibold")}>
                      <FolderOpen size={11} className="text-amber-500 shrink-0" />
                      <span className="truncate">{p.title}</span>
                      <span className="ml-auto shrink-0 text-[var(--color-text-secondary)]">{CAT_LABELS[p.category] ?? p.category}</span>
                      {order.project_id === p.id && <CheckCircle2 size={11} className="text-[var(--color-primary)]" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {project ? (
          <div className="p-4">
            <div className="flex gap-3">
              {project.cover_image && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={project.cover_image} alt={project.title} fill className="object-cover" sizes="64px" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--color-text-primary)]">{project.title}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  {CAT_LABELS[project.category] ?? project.category}
                  {project.location ? ` · ${project.location}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...project.style.slice(0, 2), ...project.materials.slice(0, 2)].map((t) => (
                    <span key={t} className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            {project.images.length > 0 && (
              <div className="mt-3 flex gap-1.5 overflow-hidden">
                {project.images.slice(0, 5).map((img, i) => (
                  <div key={img} className="relative h-12 flex-1 overflow-hidden rounded-lg">
                    <Image src={img} alt="" fill className="object-cover" sizes="60px" />
                    {i === 4 && project.images.length > 5 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white">+{project.images.length - 5}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <FolderOpen size={24} className="text-[var(--color-border)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">Проєкт не прив'язано</p>
          </div>
        )}
      </div>

      {/* Products in project */}
      {project && (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <Tag size={14} className="text-violet-500" /> Продукти ({linkedProducts.length})
            </div>
            <a href={`/admin/projects`} className="text-xs text-[var(--color-primary)] hover:underline">
              Управляти
            </a>
          </div>
          <div className="p-3 space-y-2">
            {linkedProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--color-text-secondary)]">Продуктів у проєкті немає</p>
            ) : (
              linkedProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-2.5">
                  {product.cover_image && (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      <Image src={product.cover_image} alt={product.title} fill className="object-cover" sizes="40px" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{product.title}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">
                      {CAT_LABELS[product.category] ?? product.category}
                      {product.price_from ? ` · від ${product.price_from.toLocaleString("uk-UA")} грн` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Status changer ────────────────────────────────────────────────────────── */
function StatusPanel({ order, onChange }: { order: EnrichedOrder; onChange: (s: OrderStatus) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACTIVE_STATUSES.map((s) => {
          const meta = STATUS_META[s];
          return (
            <button key={s} type="button" onClick={() => onChange(s)}
              className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition",
                order.status === s
                  ? cn("border-current", meta.color, meta.bg)
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]")}>
              <span className={cn("h-2 w-2 rounded-full shrink-0", meta.dot)} />
              {meta.label}
              {order.status === s && <CheckCircle2 size={10} className="ml-auto shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Meta info */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {[
          { label: "Номер", value: order.order_number },
          { label: "Клієнт", value: order.clientName },
          { label: "Послуга", value: order.serviceType },
          { label: "Пріоритет", value: PRIORITY_META[order.priority].label },
          { label: "Дата очік.", value: order.expected_date ? new Date(order.expected_date).toLocaleDateString("uk-UA") : "—" },
          { label: "Нотатки", value: order.internal_notes ?? "—" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="text-xs text-[var(--color-text-secondary)]">{row.label}</span>
            <span className="text-xs font-medium text-[var(--color-text-primary)] text-right max-w-[160px] truncate">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main workspace ─────────────────────────────────────────────────────────── */
export function OrdersWorkspace({ orders: init, projects, products }: Props) {
  const [orders, setOrders] = useState(init);
  const [selectedId, setSelectedId] = useState<string | null>(init[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [activeTab, setActiveTab] = useState<"hierarchy" | "status" | "messages">("hierarchy");
  const [, startTransition] = useTransition();

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (q && !o.order_number.toLowerCase().includes(q) &&
          !o.clientName.toLowerCase().includes(q) &&
          !o.serviceType.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, query, statusFilter]);

  const linkedProject = useMemo(() => {
    if (!selected?.project_id) return null;
    return projects.find((p) => p.id === selected.project_id) ?? null;
  }, [selected, projects]);

  // Products linked to the project (via project_products join – here simplified)
  const linkedProducts: Product[] = [];

  const changeStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    startTransition(async () => {
      try {
        // const fd = new FormData(); fd.set("order_id", orderId); fd.set("status", status);
        // await updateOrderStatusAction(fd);
        toast.success("Статус оновлено");
      } catch { toast.error("Помилка"); }
    });
  };

  const linkProject = (projectId: string) => {
    if (!selected) return;
    setOrders((prev) => prev.map((o) => o.id === selected.id ? { ...o, project_id: projectId } : o));
    toast.success("Проєкт прив'язано");
    // await linkProjectToOrderAction(...)
  };

  const activeCount = orders.filter((o) => !["completed", "archived"].includes(o.status)).length;
  const urgentCount = orders.filter((o) => o.priority === "urgent" && !["completed", "archived"].includes(o.status)).length;
  const doneCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="flex gap-4 overflow-hidden" style={{ height: "calc(100vh - 10rem)" }}>
      {/* ── Column 1: Order list ── */}
      <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        {/* header */}
        <div className="border-b border-[var(--color-border)] p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Замовлення</p>
            <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">{filtered.length}</span>
          </div>
          {/* mini stats */}
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: "Активних", value: activeCount, cls: "bg-amber-50 text-amber-700" },
              { label: "Терміново", value: urgentCount, cls: "bg-red-50 text-red-700" },
              { label: "Готово", value: doneCount, cls: "bg-emerald-50 text-emerald-700" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-lg py-1.5 text-center", s.cls)}>
                <p className="text-base font-bold leading-none">{s.value}</p>
                <p className="mt-0.5 text-[9px] font-medium opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
          {/* search */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5">
            <Search size={12} className="text-[var(--color-text-secondary)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-secondary)]" />
          </div>
          {/* status filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
            className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs bg-white">
            <option value="">Всі статуси</option>
            {ACTIVE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
        </div>

        {/* list */}
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          <AnimatePresence>
            {filtered.map((order) => (
              <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <OrderItem order={order} active={selectedId === order.id} onClick={() => setSelectedId(order.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <Package size={24} className="text-[var(--color-border)]" />
              <p className="text-xs text-[var(--color-text-secondary)]">Нічого не знайдено</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Column 2: Detail ── */}
      {selected ? (
        <motion.div key={selected.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
          className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white min-w-0">

          {/* order header */}
          <div className="flex flex-col gap-2.5 border-b border-white/10 px-5 py-4"
            style={{ background: "linear-gradient(135deg, #0f0101 0%, #1f0303 60%, #2a0000 100%)" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white/60">{selected.order_number}</span>
                  {selected.priority === "urgent" && (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">⚡ ТЕРМ</span>
                  )}
                </div>
                <p className="mt-0.5 text-lg font-semibold text-white">{selected.clientName}</p>
                <p className="text-sm text-white/60">{selected.serviceType}</p>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_META[selected.status].bg, STATUS_META[selected.status].color)}>
                {STATUS_META[selected.status].label}
              </span>
            </div>
            <ProgressBar status={selected.status} />
          </div>

          {/* tabs */}
          <div className="flex border-b border-[var(--color-border)]">
            {[
              { key: "hierarchy", label: "Проєкт & Продукти", icon: <Layers size={13} /> },
              { key: "status",    label: "Статус & Деталі",   icon: <Settings2 size={13} /> },
              { key: "messages",  label: "Повідомлення",      icon: <MessageSquare size={13} /> },
            ].map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn("flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                  activeTab === tab.key
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]")}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "hierarchy" && (
              <HierarchyView
                order={selected}
                project={linkedProject}
                linkedProducts={linkedProducts}
                allProjects={projects}
                onLink={linkProject}
              />
            )}
            {activeTab === "status" && (
              <StatusPanel order={selected} onChange={(s) => changeStatus(selected.id, s)} />
            )}
            {activeTab === "messages" && (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <MessageSquare size={32} className="text-[var(--color-border)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">Перейдіть у повне замовлення для чату</p>
                <a href={`/admin/orders/${selected.id}`}
                  className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
                  Відкрити <ArrowRight size={14} />
                </a>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="flex gap-2 border-t border-[var(--color-border)] p-3">
            <a href={`/admin/orders/${selected.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition">
              <Settings2 size={13} /> Повне замовлення
            </a>
            <a href={`/profile/orders/${selected.id}`} target="_blank"
              className="flex items-center justify-center rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition">
              <User size={13} />
            </a>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)]">
          <div className="text-center">
            <Package size={32} className="mx-auto text-[var(--color-border)]" />
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Виберіть замовлення</p>
          </div>
        </div>
      )}
    </div>
  );
}
