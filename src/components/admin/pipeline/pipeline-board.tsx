"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
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
  Calendar,
  ChevronDown,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { updateDealStageAction } from "@/actions/admin/deals";
import {
  DEAL_STAGE_COLORS,
  PIPELINE_STAGES,
  type Deal,
  type DealStage,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { deals: Deal[] };

const SERVICE_ICONS: Record<string, string> = {
  "Двері": "🚪",
  "Меблі": "🪑",
  "Вікна": "🪟",
  "Реставрація": "🛠️",
};

// ─── Deal Card ────────────────────────────────────────────
function DealCard({
  deal,
  floating = false,
  faded = false,
  onClick,
}: {
  deal: Deal;
  floating?: boolean;
  faded?: boolean;
  onClick?: () => void;
}) {
  const colors = DEAL_STAGE_COLORS[deal.stage];
  const icon = deal.service_type ? (SERVICE_ICONS[deal.service_type] ?? "📋") : "📋";
  const unread = deal.unread_count ?? 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-xl border bg-white p-3 shadow-sm select-none transition-all duration-150",
        faded && "opacity-30 shadow-none",
        floating && "rotate-1 shadow-2xl ring-2 ring-[var(--color-primary)]/30",
        !faded && !floating && "hover:shadow-md hover:-translate-y-px",
        onClick && "cursor-pointer",
      )}
    >
      {/* Header row */}
      <div className="mb-2 flex items-start justify-between gap-1.5">
        <span className="text-sm leading-none">{icon}</span>
        <div className="flex items-center gap-1">
          {deal.priority === "urgent" && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
              <Zap size={8} /> ТЕРМ
            </span>
          )}
          {unread > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              <MessageSquare size={8} />
              {unread}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="mb-1 text-xs font-semibold leading-snug text-[var(--color-text-primary)] line-clamp-2">
        {deal.title}
      </p>

      {/* Contact */}
      {deal.contact && (
        <p className="mb-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
          {deal.contact.name}
        </p>
      )}
      {deal.contact?.phone && (
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
          <Phone size={9} className="shrink-0" />
          <span>{deal.contact.phone}</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between gap-1">
        {deal.expected_date ? (
          <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
            <Calendar size={9} />
            {new Date(deal.expected_date).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" })}
          </div>
        ) : <span />}
        {deal.value && (
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", colors.bg, colors.text)}>
            {deal.value.toLocaleString("uk-UA")} грн
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Draggable wrapper ────────────────────────────────────
function DraggableDealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn("touch-none", isDragging && "opacity-30")}>
      <DealCard deal={deal} onClick={onClick} />
    </div>
  );
}

// ─── Stage Column ─────────────────────────────────────────
function StageColumn({
  stage,
  label,
  deals,
  onCardClick,
}: {
  stage: DealStage;
  label: string;
  deals: Deal[];
  onCardClick: (deal: Deal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const colors = DEAL_STAGE_COLORS[stage];
  const totalValue = deals.reduce((s, d) => s + (d.value ?? 0), 0);

  return (
    <div className="flex w-[220px] shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className={cn("rounded-xl px-3 py-2", colors.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
            <span className={cn("text-[11px] font-semibold", colors.text)}>{label}</span>
          </div>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", colors.text, "bg-white/50")}>
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className={cn("mt-0.5 text-[10px] font-medium opacity-70", colors.text)}>
            {(totalValue / 1000).toFixed(0)}k грн
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-xl p-2 transition-colors duration-150 min-h-[100px]",
          isOver
            ? "bg-[var(--color-primary-100)] ring-1 ring-[var(--color-primary)]/30"
            : "bg-[var(--color-bg-section)]",
        )}
      >
        {deals.map((deal) => (
          <DraggableDealCard
            key={deal.id}
            deal={deal}
            onClick={() => onCardClick(deal)}
          />
        ))}
        {deals.length === 0 && (
          <div className={cn(
            "flex flex-1 items-center justify-center py-8 text-[10px] text-[var(--color-text-muted)] transition-colors",
            isOver && "text-[var(--color-primary)]",
          )}>
            ↓
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Group divider ────────────────────────────────────────
function GroupLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-start pt-10">
      <div
        className={cn("rounded-lg px-2 py-3 text-[9px] font-bold uppercase tracking-widest", color)}
        style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────
export function PipelineBoard({ deals: initialDeals }: Props) {
  const router = useRouter();
  const t = useTranslations("admin.crm.pipeline");
  const ts = useTranslations("admin.crm.stages");

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
    if (!q) return deals;
    return deals.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.contact?.name.toLowerCase().includes(q) ||
      d.contact?.phone?.includes(q) ||
      d.service_type?.toLowerCase().includes(q),
    );
  }, [deals, search]);

  const byStage = useMemo(() => {
    const map = new Map<DealStage, Deal[]>();
    for (const s of PIPELINE_STAGES) map.set(s, []);
    for (const d of filtered) {
      if (PIPELINE_STAGES.includes(d.stage)) map.get(d.stage)!.push(d);
    }
    return map;
  }, [filtered]);

  const terminalDeals = useMemo(
    () => filtered.filter((d) => !PIPELINE_STAGES.includes(d.stage)),
    [filtered],
  );

  const totalUnread = deals.reduce((s, d) => s + (d.unread_count ?? 0), 0);

  // Stage summary stats
  const pipelineTotal = PIPELINE_STAGES.reduce((s, stage) => {
    return s + (byStage.get(stage) ?? []).reduce((v, d) => v + (d.value ?? 0), 0);
  }, 0);

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(active.id as string);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const newStage = over.id as DealStage;
    const deal = deals.find((d) => d.id === active.id);
    if (!deal || deal.stage === newStage) return;

    setDeals((prev) => prev.map((d) => d.id === deal.id ? { ...d, stage: newStage } : d));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", deal.id);
      fd.set("stage", newStage);
      const result = await updateDealStageAction(fd);
      if (!result.ok) {
        toast.error(result.message);
        setDeals((prev) => prev.map((d) => d.id === deal.id ? { ...d, stage: deal.stage } : d));
      }
    });
  };

  const PRE_SALE: DealStage[] = ["lead", "contacted", "quoted"];
  const PRODUCTION: DealStage[] = ["consulting", "design", "approved", "production", "ready", "installation"];

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
          />
        </div>

        {/* Stats pills */}
        <div className="hidden items-center gap-2 lg:flex">
          <span className="rounded-xl bg-white border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-text-primary)]">{filtered.filter(d => PIPELINE_STAGES.includes(d.stage)).length}</span> угод
          </span>
          {pipelineTotal > 0 && (
            <span className="rounded-xl bg-white border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
              <span className="font-semibold text-[var(--color-text-primary)]">{(pipelineTotal / 1000).toFixed(0)}k</span> грн
            </span>
          )}
          {totalUnread > 0 && (
            <span className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600">
              <MessageSquare size={12} />
              {t("unread", { count: totalUnread })}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/pipeline/new")}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-primary-700)] transition-colors"
        >
          <Plus size={14} />
          {t("newDeal")}
        </button>
      </div>

      {/* Kanban board */}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-2 items-start" style={{ minWidth: "max-content" }}>
            {/* Pre-sale group */}
            <GroupLabel label={t("preSale")} color="bg-sky-100 text-sky-700" />
            {PRE_SALE.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                label={ts(stage)}
                deals={byStage.get(stage) ?? []}
                onCardClick={(d) => router.push(`/admin/pipeline/${d.id}`)}
              />
            ))}

            {/* Divider */}
            <div className="mx-1 self-stretch flex items-center">
              <div className="h-full w-px bg-[var(--color-border)]" />
            </div>

            {/* Production group */}
            <GroupLabel label={t("production")} color="bg-amber-100 text-amber-700" />
            {PRODUCTION.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                label={ts(stage)}
                deals={byStage.get(stage) ?? []}
                onCardClick={(d) => router.push(`/admin/pipeline/${d.id}`)}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
          {activeDeal ? <DealCard deal={activeDeal} floating /> : null}
        </DragOverlay>
      </DndContext>

      {/* Terminal deals */}
      {terminalDeals.length > 0 && (
        <div className="border-t border-[var(--color-border)] pt-3">
          <button
            type="button"
            onClick={() => setShowTerminal((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <ChevronDown
              size={13}
              className={cn("transition-transform", showTerminal && "rotate-180")}
            />
            {showTerminal
              ? t("hideClosed")
              : t("showClosed", { count: terminalDeals.length })}
          </button>

          <AnimatePresence>
            {showTerminal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 overflow-hidden"
              >
                {terminalDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    faded
                    onClick={() => router.push(`/admin/pipeline/${deal.id}`)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
