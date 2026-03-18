"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Layers,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Search,
  Settings2,
  Tag,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { updateOrderProjectAction, updateOrderStatusAction } from "@/actions/orders";
import type { Order, OrderPriority, OrderStatus, Product, Project } from "@/lib/types";
import { ORDER_PRIORITY_LABELS, ORDER_STATUS_LABELS, PRODUCT_CATEGORY_LABELS, PROJECT_CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type EnrichedOrder = Order & {
  clientName: string;
  serviceType: string;
};

type OrdersWorkspaceProps = {
  orders: EnrichedOrder[];
  projects: Project[];
  products: Product[];
  projectProductMap: Record<string, string[]>;
};

const STATUS_META: Record<
  OrderStatus,
  { color: string; background: string; dot: string; step: number }
> = {
  new: {
    color: "text-zinc-600",
    background: "bg-zinc-100",
    dot: "bg-zinc-400",
    step: 1,
  },
  consulting: {
    color: "text-sky-700",
    background: "bg-sky-100",
    dot: "bg-sky-500",
    step: 2,
  },
  design: {
    color: "text-violet-700",
    background: "bg-violet-100",
    dot: "bg-violet-500",
    step: 3,
  },
  approved: {
    color: "text-blue-700",
    background: "bg-blue-100",
    dot: "bg-blue-500",
    step: 4,
  },
  production: {
    color: "text-amber-700",
    background: "bg-amber-100",
    dot: "bg-amber-500",
    step: 5,
  },
  ready: {
    color: "text-teal-700",
    background: "bg-teal-100",
    dot: "bg-teal-500",
    step: 6,
  },
  installation: {
    color: "text-orange-700",
    background: "bg-orange-100",
    dot: "bg-orange-500",
    step: 7,
  },
  completed: {
    color: "text-emerald-700",
    background: "bg-emerald-100",
    dot: "bg-emerald-500",
    step: 8,
  },
  archived: {
    color: "text-zinc-400",
    background: "bg-zinc-50",
    dot: "bg-zinc-300",
    step: 0,
  },
};

const ACTIVE_STATUSES = (Object.keys(STATUS_META) as OrderStatus[]).filter(
  (status) => status !== "archived",
);

const PRIORITY_META: Record<OrderPriority, { color: string }> = {
  normal: { color: "text-[var(--color-text-secondary)]" },
  urgent: { color: "text-red-700" },
};

function getCategoryLabel(category: string) {
  if (category in PRODUCT_CATEGORY_LABELS) {
    return PRODUCT_CATEGORY_LABELS[category as keyof typeof PRODUCT_CATEGORY_LABELS];
  }

  if (category in PROJECT_CATEGORY_LABELS) {
    return PROJECT_CATEGORY_LABELS[category as keyof typeof PROJECT_CATEGORY_LABELS];
  }

  return category;
}

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
        <span
          className={cn(
            "font-mono text-[10px] font-semibold",
            active ? "text-white/60" : "text-[var(--color-text-secondary)]",
          )}
        >
          {order.order_number}
        </span>
        {order.priority === "urgent" ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              active ? "bg-white/20 text-amber-100" : "bg-amber-100 text-amber-700",
            )}
          >
            ⚡
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "text-sm font-semibold leading-tight",
          active ? "text-white" : "text-[var(--color-text-primary)]",
        )}
      >
        {order.clientName}
      </p>
      <p className={cn("truncate text-xs", active ? "text-white/60" : "text-[var(--color-text-secondary)]")}>
        {order.serviceType}
      </p>

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
            active ? "bg-white/15 text-white/80" : cn(meta.background, meta.color),
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-white/50" : meta.dot)} />
          {ORDER_STATUS_LABELS[order.status]}
        </span>

        {order.expected_date ? (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[10px]",
              active ? "text-white/50" : "text-[var(--color-text-secondary)]",
            )}
          >
            <Calendar size={9} />
            {new Date(order.expected_date).toLocaleDateString("uk-UA", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function HierarchyView({
  allProjects,
  linkedProducts,
  onLink,
  order,
  project,
}: {
  allProjects: Project[];
  linkedProducts: Product[];
  onLink: (projectId: string | null) => void;
  order: EnrichedOrder;
  project: Project | null;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const normalizedQuery = search.toLowerCase().trim();
    return allProjects
      .filter((item) =>
        normalizedQuery ? item.title.toLowerCase().includes(normalizedQuery) : true,
      )
      .slice(0, 8);
  }, [allProjects, search]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[var(--color-surface)] px-3 py-2">
        <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-semibold shadow-sm">
          <Package size={11} className="text-[var(--color-primary)]" />
          {order.order_number}
        </span>
        <ChevronRight size={12} className="text-[var(--color-border)]" />
        <span
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium",
            project
              ? "bg-white shadow-sm"
              : "border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)]",
          )}
        >
          <FolderOpen
            size={11}
            className={project ? "text-amber-500" : "text-[var(--color-border)]"}
          />
          {project ? project.title : "Без проєкту"}
        </span>
        {project ? (
          <>
            <ChevronRight size={12} className="text-[var(--color-border)]" />
            <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-medium shadow-sm">
              <Tag size={11} className="text-violet-500" />
              {linkedProducts.length} продуктів
            </span>
          </>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <FolderOpen size={14} className="text-amber-500" />
            Проєкт виробництва
          </div>
          <button
            type="button"
            onClick={() => setLinkOpen((value) => !value)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            {project ? (
              <>
                <Pencil size={11} />
                Змінити
              </>
            ) : (
              <>
                <Plus size={11} />
                Прив&apos;язати
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {linkOpen ? (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 border-b border-[var(--color-border)] bg-[var(--color-primary-100)] p-3">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5">
                  <Search size={12} className="text-[var(--color-text-secondary)]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Пошук проєктів..."
                    className="flex-1 bg-transparent text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onLink(null);
                      setLinkOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition hover:bg-white",
                      !order.project_id ? "bg-white font-semibold" : "",
                    )}
                  >
                    <X size={11} className="shrink-0 text-zinc-500" />
                    Без проєкту
                    {!order.project_id ? (
                      <CheckCircle2 size={11} className="ml-auto text-[var(--color-primary)]" />
                    ) : null}
                  </button>
                </div>

                <div className="max-h-36 space-y-1 overflow-y-auto">
                  {filteredProjects.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onLink(item.id);
                        setLinkOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition hover:bg-white",
                        order.project_id === item.id ? "bg-white font-semibold" : "",
                      )}
                    >
                      <FolderOpen size={11} className="shrink-0 text-amber-500" />
                      <span className="truncate">{item.title}</span>
                      <span className="ml-auto shrink-0 text-[var(--color-text-secondary)]">
                        {getCategoryLabel(item.category)}
                      </span>
                      {order.project_id === item.id ? (
                        <CheckCircle2 size={11} className="text-[var(--color-primary)]" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {project ? (
          <div className="p-4">
            <div className="flex gap-3">
              {project.cover_image ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={project.cover_image} alt={project.title} fill className="object-cover" sizes="64px" />
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--color-text-primary)]">{project.title}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  {getCategoryLabel(project.category)}
                  {project.location ? ` · ${project.location}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...project.style.slice(0, 2), ...project.materials.slice(0, 2)].map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <FolderOpen size={24} className="text-[var(--color-border)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">Проєкт не прив&apos;язано</p>
          </div>
        )}
      </div>

      {project ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <Tag size={14} className="text-violet-500" />
              Продукти ({linkedProducts.length})
            </div>
            <a href="/admin/projects" className="text-xs text-[var(--color-primary)] hover:underline">
              Керувати
            </a>
          </div>

          <div className="space-y-2 p-3">
            {linkedProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
                У проєкті ще немає продуктів
              </p>
            ) : (
              linkedProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-2.5">
                  {product.cover_image ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      <Image src={product.cover_image} alt={product.title} fill className="object-cover" sizes="40px" />
                    </div>
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {product.title}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">
                      {getCategoryLabel(product.category)}
                      {product.price_from ? ` · від ${product.price_from.toLocaleString("uk-UA")} грн` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusPanel({
  onChange,
  order,
}: {
  onChange: (status: OrderStatus) => void;
  order: EnrichedOrder;
}) {
  return (
    <div className="space-y-3">
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
              {order.status === status ? <CheckCircle2 size={10} className="ml-auto shrink-0" /> : null}
            </button>
          );
        })}
      </div>

      <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)]">
        {[
          { label: "Номер", value: order.order_number },
          { label: "Клієнт", value: order.clientName },
          { label: "Послуга", value: order.serviceType },
          {
            label: "Пріоритет",
            value: ORDER_PRIORITY_LABELS[order.priority],
            valueClassName: PRIORITY_META[order.priority].color,
          },
          {
            label: "Дата очікування",
            value: order.expected_date ? new Date(order.expected_date).toLocaleDateString("uk-UA") : "—",
          },
          { label: "Нотатки", value: order.internal_notes ?? "—" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="text-xs text-[var(--color-text-secondary)]">{row.label}</span>
            <span
              className={cn(
                "max-w-[180px] truncate text-right text-xs font-medium text-[var(--color-text-primary)]",
                row.valueClassName ?? "",
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrdersWorkspace({
  orders: initialOrders,
  products,
  projectProductMap,
  projects,
}: OrdersWorkspaceProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedId, setSelectedId] = useState<string | null>(initialOrders[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [activeTab, setActiveTab] = useState<"hierarchy" | "status" | "messages">("hierarchy");
  const [, startTransition] = useTransition();

  const effectiveSelectedId =
    selectedId && orders.some((order) => order.id === selectedId)
      ? selectedId
      : orders[0]?.id ?? null;

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === effectiveSelectedId) ?? null,
    [effectiveSelectedId, orders],
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        order.order_number.toLowerCase().includes(normalizedQuery) ||
        order.clientName.toLowerCase().includes(normalizedQuery) ||
        order.serviceType.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [orders, query, statusFilter]);

  const selectedProject = selectedOrder?.project_id
    ? projects.find((project) => project.id === selectedOrder.project_id) ?? null
    : null;

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const linkedProducts = selectedOrder?.project_id
    ? (projectProductMap[selectedOrder.project_id] ?? [])
        .map((productId) => productMap.get(productId))
        .filter((product): product is Product => Boolean(product))
    : [];

  const activeCount = useMemo(
    () => orders.filter((order) => !["completed", "archived"].includes(order.status)).length,
    [orders],
  );
  const urgentCount = useMemo(
    () =>
      orders.filter(
        (order) => order.priority === "urgent" && !["completed", "archived"].includes(order.status),
      ).length,
    [orders],
  );
  const doneCount = useMemo(
    () => orders.filter((order) => order.status === "completed").length,
    [orders],
  );

  const changeStatus = (orderId: string, status: OrderStatus) => {
    const previousOrders = orders;

    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("order_id", orderId);
        formData.set("status", status);

        const result = await updateOrderStatusAction(formData);
        if (!result.ok) {
          setOrders(previousOrders);
          toast.error(result.message);
          return;
        }

        toast.success("Статус замовлення оновлено");
      } catch {
        setOrders(previousOrders);
        toast.error("Не вдалося оновити статус замовлення");
      }
    });
  };

  const linkProject = (projectId: string | null) => {
    if (!selectedOrder) {
      return;
    }

    const previousOrders = orders;
    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrder.id ? { ...order, project_id: projectId } : order,
      ),
    );

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("order_id", selectedOrder.id);
        if (projectId) {
          formData.set("project_id", projectId);
        }

        const result = await updateOrderProjectAction(formData);
        if (!result.ok) {
          setOrders(previousOrders);
          toast.error(result.message);
          return;
        }

        toast.success(projectId ? "Проєкт прив'язано" : "Проєкт відв'язано");
      } catch {
        setOrders(previousOrders);
        toast.error("Не вдалося оновити проєкт для замовлення");
      }
    });
  };

  return (
    <div className="grid min-h-[42rem] gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="flex min-h-[42rem] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="space-y-2.5 border-b border-[var(--color-border)] p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Замовлення</p>
            <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
              {filteredOrders.length}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {[
              { label: "Активних", value: activeCount, className: "bg-amber-50 text-amber-700" },
              { label: "Терміново", value: urgentCount, className: "bg-red-50 text-red-700" },
              { label: "Готово", value: doneCount, className: "bg-emerald-50 text-emerald-700" },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-lg py-1.5 text-center", item.className)}>
                <p className="text-base font-bold leading-none">{item.value}</p>
                <p className="mt-0.5 text-[9px] font-medium opacity-80">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5">
            <Search size={12} className="text-[var(--color-text-secondary)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Пошук..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs"
          >
            <option value="">Всі статуси</option>
            {ACTIVE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

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

          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Package size={24} className="text-[var(--color-border)]" />
              <p className="text-xs text-[var(--color-text-secondary)]">Нічого не знайдено</p>
            </div>
          ) : null}
        </div>
      </div>

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
                  <span className="font-mono text-sm font-bold text-white/60">
                    {selectedOrder.order_number}
                  </span>
                  {selectedOrder.priority === "urgent" ? (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      ⚡ ТЕРМ
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-lg font-semibold text-white">{selectedOrder.clientName}</p>
                <p className="text-sm text-white/60">{selectedOrder.serviceType}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  STATUS_META[selectedOrder.status].background,
                  STATUS_META[selectedOrder.status].color,
                )}
              >
                {ORDER_STATUS_LABELS[selectedOrder.status]}
              </span>
            </div>
            <ProgressBar status={selectedOrder.status} />
          </div>

          <div className="flex border-b border-[var(--color-border)]">
            {[
              { key: "hierarchy", label: "Проєкт і продукти", icon: <Layers size={13} /> },
              { key: "status", label: "Статус і деталі", icon: <Settings2 size={13} /> },
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
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "hierarchy" ? (
              <HierarchyView
                order={selectedOrder}
                project={selectedProject}
                linkedProducts={linkedProducts}
                allProjects={projects}
                onLink={linkProject}
              />
            ) : null}

            {activeTab === "status" ? (
              <StatusPanel order={selectedOrder} onChange={(status) => changeStatus(selectedOrder.id, status)} />
            ) : null}

            {activeTab === "messages" ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <MessageSquare size={32} className="text-[var(--color-border)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Перейдіть у повне замовлення для історії повідомлень
                </p>
                <a
                  href={`/admin/orders/${selectedOrder.id}`}
                  className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Відкрити
                  <ArrowRight size={14} />
                </a>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 border-t border-[var(--color-border)] p-3">
            <a
              href={`/admin/orders/${selectedOrder.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] py-2 text-xs text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)]"
            >
              <Settings2 size={13} />
              Повне замовлення
            </a>
            <a
              href={`/profile/orders/${selectedOrder.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)]"
            >
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
  );
}
