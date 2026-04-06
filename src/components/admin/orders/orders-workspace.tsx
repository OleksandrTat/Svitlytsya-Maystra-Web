"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Kanban,
  List,
  MessageSquare,
  Package,
  Search,
  Settings2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { updateOrderStatusAction } from "@/actions/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type EnrichedOrder = Order & {
  clientName: string;
  serviceType: string;
};

type OrdersWorkspaceProps = {
  orders: EnrichedOrder[];
};

const STATUS_META: Record<
  OrderStatus,
  { color: string; background: string; dot: string; step: number; border: string }
> = {
  new:          { color: "text-zinc-600",    background: "bg-zinc-100",    dot: "bg-zinc-400",    step: 1, border: "border-zinc-200" },
  consulting:   { color: "text-sky-700",     background: "bg-sky-100",     dot: "bg-sky-500",     step: 2, border: "border-sky-200" },
  design:       { color: "text-violet-700",  background: "bg-violet-100",  dot: "bg-violet-500",  step: 3, border: "border-violet-200" },
  approved:     { color: "text-blue-700",    background: "bg-blue-100",    dot: "bg-blue-500",    step: 4, border: "border-blue-200" },
  production:   { color: "text-amber-700",   background: "bg-amber-100",   dot: "bg-amber-500",   step: 5, border: "border-amber-200" },
  ready:        { color: "text-teal-700",    background: "bg-teal-100",    dot: "bg-teal-500",    step: 6, border: "border-teal-200" },
  installation: { color: "text-orange-700",  background: "bg-orange-100",  dot: "bg-orange-500",  step: 7, border: "border-orange-200" },
  completed:    { color: "text-emerald-700", background: "bg-emerald-100", dot: "bg-emerald-500", step: 8, border: "border-emerald-200" },
  archived:     { color: "text-zinc-400",    background: "bg-zinc-50",     dot: "bg-zinc-300",    step: 0, border: "border-zinc-100" },
};

const ACTIVE_STATUSES = (Object.keys(STATUS_META) as OrderStatus[]).filter(
  (s) => s !== "archived",
);

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  const percent = meta.step > 0 ? Math.round((meta.step / 8) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-white/70">{ORDER_STATUS_LABELS[status]}</span>
        <span className="font-semibold text-white/90">{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-white"
        />
      </div>
    </div>
  );
}

// ─── List view item ───────────────────────────────────────────────────────────

function OrderListItem({
  active,
  onClick,
  order,
}: {
  active: boolean;
  onClick: () => void;
  order: EnrichedOrder;
}) {
  const meta = STATUS_META[order.status];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col gap-1.5 rounded-xl p-3 text-left transition",
        active ? "bg-[var(--color-primary)] text-white" : "hover:bg-[var(--color-surface)]",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn("font-mono text-[10px] font-semibold", active ? "text-white/60" : "text-[var(--color-text-secondary)]")}>
          {order.order_number}
        </span>
        {order.priority === "urgent" && (
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", active ? "bg-white/20 text-amber-100" : "bg-amber-100 text-amber-700")}>
            ТЕРМ
          </span>
        )}
      </div>
      <p className={cn("text-sm font-semibold leading-tight", active ? "text-white" : "text-[var(--color-text-primary)]")}>
        {order.clientName}
      </p>
      <p className={cn("truncate text-xs", active ? "text-white/60" : "text-[var(--color-text-secondary)]")}>
        {order.serviceType}
      </p>
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium", active ? "bg-white/15 text-white/80" : cn(meta.background, meta.color))}>
          <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-white/50" : meta.dot)} />
          {ORDER_STATUS_LABELS[order.status]}
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

// ─── Status panel ─────────────────────────────────────────────────────────────

function StatusPanel({ onChange, order }: { onChange: (s: OrderStatus) => void; order: EnrichedOrder }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ACTIVE_STATUSES.map((status) => {
        const meta = STATUS_META[status];
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition",
              order.status === status
                ? cn("border-current", meta.color, meta.background)
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]",
            )}
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
            {ORDER_STATUS_LABELS[status]}
            {order.status === status && <CheckCircle2 size={10} className="ml-auto shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Kanban card content (no dnd hooks — reused in overlay too) ───────────────

function KanbanCardContent({ order, faded = false, floating = false }: { order: EnrichedOrder; faded?: boolean; floating?: boolean }) {
  const meta = STATUS_META[order.status];
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3 shadow-sm select-none transition",
        faded && "opacity-25 shadow-none",
        floating && "rotate-1 shadow-2xl ring-2 ring-[var(--color-primary)]/40",
        !faded && !floating && "hover:shadow-md",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{order.order_number}</span>
        {order.priority === "urgent" && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">ТЕРМ</span>
        )}
      </div>
      <p className="mb-0.5 text-sm font-semibold leading-tight text-[var(--color-text-primary)]">{order.clientName}</p>
      <p className="mb-2 truncate text-xs text-[var(--color-text-muted)]">{order.serviceType}</p>
      {order.expected_date && (
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
          <Calendar size={9} />
          {new Date(order.expected_date).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" })}
        </div>
      )}
      <div className="mt-2 flex justify-end">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", meta.background, meta.color)}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>
    </div>
  );
}

// ─── Kanban card (draggable) ──────────────────────────────────────────────────

function KanbanCard({ order, onClick }: { order: EnrichedOrder; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none active:cursor-grabbing"
      onClick={isDragging ? undefined : onClick}
    >
      <KanbanCardContent order={order} faded={isDragging} />
    </div>
  );
}

// ─── Kanban column (droppable) ────────────────────────────────────────────────

function KanbanColumn({
  status,
  orders,
  onCardClick,
}: {
  status: OrderStatus;
  orders: EnrichedOrder[];
  onCardClick: (order: EnrichedOrder) => void;
}) {
  const meta = STATUS_META[status];
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex w-56 shrink-0 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-section)]">
      {/* Column header */}
      <div className={cn("flex items-center gap-2 rounded-t-2xl border-b px-3 py-2.5", meta.border, meta.background)}>
        <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
        <span className={cn("flex-1 text-xs font-semibold", meta.color)}>{ORDER_STATUS_LABELS[status]}</span>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", meta.background, meta.color)}>
          {orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors",
          isOver && "bg-[var(--color-primary)]/5 ring-2 ring-inset ring-[var(--color-primary)]/20",
          orders.length === 0 && "min-h-24",
        )}
      >
        {orders.map((order) => (
          <KanbanCard key={order.id} order={order} onClick={() => onCardClick(order)} />
        ))}
        {isOver && (
          <div className="h-1.5 rounded-full bg-[var(--color-primary)]/30" />
        )}
      </div>
    </div>
  );
}

// ─── Main workspace ───────────────────────────────────────────────────────────

export function OrdersWorkspace({ orders: initialOrders }: OrdersWorkspaceProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedId, setSelectedId] = useState<string | null>(initialOrders[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [activeTab, setActiveTab] = useState<"status" | "messages">("status");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [draggingOrder, setDraggingOrder] = useState<EnrichedOrder | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const effectiveSelectedId =
    selectedId && orders.some((o) => o.id === selectedId)
      ? selectedId
      : orders[0]?.id ?? null;

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === effectiveSelectedId) ?? null,
    [effectiveSelectedId, orders],
  );

  const filteredOrders = useMemo(() => {
    const q = query.toLowerCase().trim();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.serviceType.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const kanbanByStatus = useMemo(() => {
    const map = new Map<OrderStatus, EnrichedOrder[]>();
    for (const s of ACTIVE_STATUSES) map.set(s, []);
    for (const o of filteredOrders) {
      if (map.has(o.status)) map.get(o.status)!.push(o);
    }
    return map;
  }, [filteredOrders]);

  const activeCount = useMemo(() => orders.filter((o) => !["completed", "archived"].includes(o.status)).length, [orders]);
  const urgentCount = useMemo(() => orders.filter((o) => o.priority === "urgent" && !["completed", "archived"].includes(o.status)).length, [orders]);
  const doneCount = useMemo(() => orders.filter((o) => o.status === "completed").length, [orders]);

  const changeStatus = (orderId: string, status: OrderStatus) => {
    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === orderId ? { ...o, status } : o)));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("order_id", orderId);
      fd.set("status", status);
      const result = await updateOrderStatusAction(fd);
      if (!result.ok) {
        setOrders(prev);
        toast.error(result.message);
      } else {
        toast.success("Статус оновлено");
      }
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const order = orders.find((o) => o.id === event.active.id);
    setDraggingOrder(order ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingOrder(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as OrderStatus;
    const order = orders.find((o) => o.id === active.id);
    if (!order || order.status === newStatus) return;
    changeStatus(order.id, newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 flex-1 min-w-48">
            <Search size={12} className="text-[var(--color-text-secondary)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук замовлень..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
            className="rounded-lg border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs"
          >
            <option value="">Всі статуси</option>
            {ACTIVE_STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition",
                viewMode === "list" ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              )}
            >
              <List size={13} /> Список
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn("flex items-center gap-1.5 border-l border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition",
                viewMode === "kanban" ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              )}
            >
              <Kanban size={13} /> Kanban
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Активних", value: activeCount, className: "bg-amber-50 text-amber-700" },
            { label: "Терміново", value: urgentCount, className: "bg-red-50 text-red-700" },
            { label: "Готово", value: doneCount, className: "bg-emerald-50 text-emerald-700" },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-xl py-2 text-center", item.className)}>
              <p className="text-lg font-bold leading-none">{item.value}</p>
              <p className="mt-0.5 text-[10px] font-medium opacity-80">{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── LIST VIEW ── */}
        {viewMode === "list" && (
          <div className="grid min-h-[42rem] gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
            {/* Sidebar list */}
            <div className="flex min-h-[42rem] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                <AnimatePresence>
                  {filteredOrders.map((order) => (
                    <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <OrderListItem
                        order={order}
                        active={effectiveSelectedId === order.id}
                        onClick={() => setSelectedId(order.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredOrders.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-12">
                    <Package size={24} className="text-[var(--color-border)]" />
                    <p className="text-xs text-[var(--color-text-secondary)]">Нічого не знайдено</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detail panel */}
            {selectedOrder ? (
              <motion.div
                key={selectedOrder.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white"
              >
                <div
                  className="flex flex-col gap-2.5 border-b border-white/10 px-5 py-4"
                  style={{ background: "linear-gradient(135deg, #0f0101 0%, #1f0303 60%, #2a0000 100%)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white/60">{selectedOrder.order_number}</span>
                        {selectedOrder.priority === "urgent" && (
                          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">ТЕРМ</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-lg font-semibold text-white">{selectedOrder.clientName}</p>
                      <p className="text-sm text-white/60">{selectedOrder.serviceType}</p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_META[selectedOrder.status].background, STATUS_META[selectedOrder.status].color)}>
                      {ORDER_STATUS_LABELS[selectedOrder.status]}
                    </span>
                  </div>
                  <ProgressBar status={selectedOrder.status} />
                </div>

                <div className="flex border-b border-[var(--color-border)]">
                  {[
                    { key: "status", label: "Статус", icon: <Settings2 size={13} /> },
                    { key: "messages", label: "Повідомлення", icon: <MessageSquare size={13} /> },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key as typeof activeTab)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                        activeTab === tab.key
                          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                      )}
                    >
                      {tab.icon}{tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === "status" && (
                    <StatusPanel order={selectedOrder} onChange={(s) => changeStatus(selectedOrder.id, s)} />
                  )}
                  {activeTab === "messages" && (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <MessageSquare size={32} className="text-[var(--color-border)]" />
                      <p className="text-sm text-[var(--color-text-secondary)]">Перейдіть у повне замовлення для історії повідомлень</p>
                      <a href={`/admin/orders/${selectedOrder.id}`} className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
                        Відкрити <ArrowRight size={14} />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-t border-[var(--color-border)] p-3">
                  <a href={`/admin/orders/${selectedOrder.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] py-2 text-xs text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)]">
                    <Settings2 size={13} /> Повне замовлення
                  </a>
                  <a href={`/profile/orders/${selectedOrder.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)]">
                    <User size={13} />
                  </a>
                </div>
              </motion.div>
            ) : (
              <div className="flex min-h-[42rem] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)]">
                <div className="text-center">
                  <Package size={32} className="mx-auto text-[var(--color-border)]" />
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Виберіть замовлення</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── KANBAN VIEW ── */}
        {viewMode === "kanban" && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3" style={{ minWidth: `${ACTIVE_STATUSES.length * 236}px` }}>
              {ACTIVE_STATUSES.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  orders={kanbanByStatus.get(status) ?? []}
                  onCardClick={(order) => {
                    setSelectedId(order.id);
                    setViewMode("list");
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drag overlay — floating card while dragging */}
      <DragOverlay dropAnimation={null}>
        {draggingOrder && (
          <KanbanCardContent order={draggingOrder} floating />
        )}
      </DragOverlay>
    </DndContext>
  );
}
