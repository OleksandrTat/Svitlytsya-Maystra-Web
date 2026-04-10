"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  AlertCircle,
  Calendar,
  MessageSquare,
  Phone,
  Plus,
  Search,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { updateDealStageAction } from "@/actions/admin/deals";
import {
  DEAL_STAGE_COLORS,
  DEAL_STAGE_LABELS,
  PIPELINE_STAGES,
  type Deal,
  type DealStage,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  deals: Deal[];
};

const SERVICE_ICONS: Record<string, string> = {
  "Двері": "🚪",
  "Меблі": "🪑",
  "Вікна": "🪟",
  "Реставрація": "🛠️",
};

// Split stages into visual groups
const PRE_SALE_STAGES: DealStage[] = ["lead", "contacted", "quoted"];
const PRODUCTION_STAGES: DealStage[] = [
  "consulting", "design", "approved", "production", "ready", "installation",
];

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  const colors = DEAL_STAGE_COLORS[deal.stage];
  const icon = deal.service_type ? (SERVICE_ICONS[deal.service_type] ?? "📋") : "📋";

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3 shadow-sm transition-shadow",
        isDragging ? "shadow-lg ring-2 ring-[var(--color-primary)]/30 opacity-90" : "hover:shadow-md",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-base leading-none">{icon}</span>
        <div className="flex items-center gap-1">
          {deal.priority === "urgent" && (
            <Zap size={12} className="text-red-500" />
          )}
          {(deal.unread_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              <MessageSquare size={9} />
              {deal.unread_count}
            </span>
          )}
        </div>
      </div>

      <p className="mb-1 text-xs font-semibold text-[var(--color-text-primary)] line-clamp-2">
        {deal.title}
      </p>

      {deal.contact && (
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
          <User size={9} />
          <span className="truncate">{deal.contact.name}</span>
        </div>
      )}

      {deal.contact?.phone && (
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
          <Phone size={9} />
          <span>{deal.contact.phone}</span>
        </div>
      )}

      {deal.expected_date && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
          <Calendar size={9} />
          <span>{new Date(deal.expected_date).toLocaleDateString("uk-UA")}</span>
        </div>
      )}

      {deal.value && (
        <div className={cn("mt-2 rounded-md px-2 py-0.5 text-[10px] font-medium", colors.bg, colors.text)}>
          {deal.value.toLocaleString("uk-UA")} грн
        </div>
      )}
    </div>
  );
}

function DraggableDealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-40")}
    >
      <DealCard deal={deal} />
    </div>
  );
}

function StageColumn({
  stage,
  deals,
  onCardClick,
}: {
  stage: DealStage;
  deals: Deal[];
  onCardClick: (deal: Deal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const colors = DEAL_STAGE_COLORS[stage];
  const label = DEAL_STAGE_LABELS[stage];

  return (
    <div className="flex w-64 shrink-0 flex-col">
      {/* Column header */}
      <div
        className={cn(
          "mb-2 flex items-center justify-between rounded-lg border px-3 py-2",
          colors.bg,
          "border-transparent",
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
          <span className={cn("text-xs font-semibold", colors.text)}>{label}</span>
        </div>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", colors.text, "bg-white/60")}>
          {deals.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-xl p-2 transition-colors min-h-[120px]",
          isOver ? "bg-[var(--color-primary-100)] ring-2 ring-[var(--color-primary)]/30" : "bg-[var(--color-bg-section)]",
        )}
      >
        {deals.map((deal) => (
          <DraggableDealCard key={deal.id} deal={deal} onClick={() => onCardClick(deal)} />
        ))}
        {deals.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-6 text-xs text-[var(--color-text-muted)]">
            Перетягни сюди
          </div>
        )}
      </div>
    </div>
  );
}

export function PipelineBoard({ deals: initialDeals }: Props) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return deals.filter((d) => {
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.contact?.name.toLowerCase().includes(q) ||
        d.contact?.phone?.includes(q) ||
        d.service_type?.toLowerCase().includes(q)
      );
    });
  }, [deals, search]);

  const byStage = useMemo(() => {
    const map = new Map<DealStage, Deal[]>();
    for (const s of PIPELINE_STAGES) map.set(s, []);
    for (const d of filtered) {
      if (PIPELINE_STAGES.includes(d.stage)) {
        map.get(d.stage)!.push(d);
      }
    }
    return map;
  }, [filtered]);

  const terminalDeals = useMemo(
    () => filtered.filter((d) => !PIPELINE_STAGES.includes(d.stage)),
    [filtered],
  );

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(active.id as string);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const newStage = over.id as DealStage;
    const deal = deals.find((d) => d.id === active.id);
    if (!deal || deal.stage === newStage) return;

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, stage: newStage } : d)),
    );

    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", deal.id);
      fd.set("stage", newStage);
      const result = await updateDealStageAction(fd);
      if (!result.ok) {
        toast.error(result.message);
        setDeals((prev) =>
          prev.map((d) => (d.id === deal.id ? { ...d, stage: deal.stage } : d)),
        );
      }
    });
  };

  const totalUnread = deals.reduce((s, d) => s + (d.unread_count ?? 0), 0);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук по угодах, клієнтах, телефону…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        {totalUnread > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            <MessageSquare size={13} />
            {totalUnread} непрочитаних
          </div>
        )}
        <button
          type="button"
          onClick={() => router.push("/admin/pipeline/new")}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--color-primary-700)]"
        >
          <Plus size={13} /> Нова угода
        </button>
      </div>

      {/* Kanban */}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {/* Pre-sale group */}
            <div className="flex gap-3">
              <div className="mb-2 flex items-center">
                <div className="flex h-full flex-col justify-start pt-8">
                  <div
                    className="writing-mode-vertical-lr rotate-180 rounded-l-lg bg-sky-100 px-1.5 py-3 text-[10px] font-bold uppercase tracking-widest text-sky-600"
                    style={{ writingMode: "vertical-lr" }}
                  >
                    До продажу
                  </div>
                </div>
              </div>
              {PRE_SALE_STAGES.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  deals={byStage.get(stage) ?? []}
                  onCardClick={(d) => router.push(`/admin/pipeline/${d.id}`)}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="mx-1 flex items-stretch">
              <div className="w-px bg-[var(--color-border)]" />
            </div>

            {/* Production group */}
            <div className="flex gap-3">
              <div className="flex items-start pt-8">
                <div
                  className="writing-mode-vertical-lr rotate-180 rounded-l-lg bg-amber-100 px-1.5 py-3 text-[10px] font-bold uppercase tracking-widest text-amber-600"
                  style={{ writingMode: "vertical-lr" }}
                >
                  Виробництво
                </div>
              </div>
              {PRODUCTION_STAGES.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  deals={byStage.get(stage) ?? []}
                  onCardClick={(d) => router.push(`/admin/pipeline/${d.id}`)}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Terminal deals toggle */}
      {terminalDeals.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowTerminal((v) => !v)}
            className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          >
            <AlertCircle size={12} />
            {showTerminal ? "Сховати" : "Показати"} завершені та архівні ({terminalDeals.length})
          </button>
          {showTerminal && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {terminalDeals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => router.push(`/admin/pipeline/${deal.id}`)}
                  className="cursor-pointer"
                >
                  <DealCard deal={deal} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
