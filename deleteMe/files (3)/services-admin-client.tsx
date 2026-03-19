"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Eye, EyeOff, GripVertical, Pencil, Plus, Star, Trash2, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ServiceFormPopup } from "@/components/admin/services/service-form-popup";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  title: string;
  slug: string;
  tagline?: string | null;
  short_description?: string | null;
  icon?: string | null;
  category: string;
  features: { title: string; description: string }[];
  process_steps: { step: number; title: string; description: string }[];
  price_from?: number | null;
  price_unit?: string | null;
  duration_days_from?: number | null;
  duration_days_to?: number | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title?: string | null;
  seo_description?: string | null;
};

type Props = { services: Service[] };

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  production:   { label: "Виробництво", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  consultation: { label: "Консультація",color: "text-sky-700",     bg: "bg-sky-50 border-sky-200" },
  installation: { label: "Монтаж",      color: "text-violet-700",  bg: "bg-violet-50 border-violet-200" },
  restoration:  { label: "Реставрація", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

export function ServicesAdminClient({ services: init }: Props) {
  const [services, setServices] = useState(init);
  const [createOpen, setCreateOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);

  const toggleActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    );
    // await toggleServiceActiveAction(id);
    toast.success("Статус оновлено");
  };

  const toggleFeatured = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_featured: !s.is_featured } : s))
    );
    toast.success("Головна сторінка оновлена");
  };

  const deleteService = (id: string) => {
    toast.warning("Видалити сервіс?", {
      duration: 5000,
      action: {
        label: "Видалити",
        onClick: () => {
          setServices((prev) => prev.filter((s) => s.id !== id));
          // await deleteServiceAction(id);
          toast.success("Сервіс видалено");
        },
      },
    });
  };

  const onSaved = (service: Service) => {
    setServices((prev) =>
      service.id
        ? prev.map((s) => (s.id === service.id ? { ...s, ...service } : s))
        : [...prev, { ...service, id: Date.now().toString() }]
    );
  };

  const stats = {
    total: services.length,
    active: services.filter((s) => s.is_active).length,
    featured: services.filter((s) => s.is_featured).length,
  };

  return (
    <div className="space-y-5">
      {/* Header stats + action */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Всього</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
            <p className="text-xs text-emerald-600">Активних</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.featured}</p>
            <p className="text-xs text-amber-600">На головній</p>
          </div>
        </div>

        <button type="button" onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)] transition">
          <Plus size={16} /> Новий сервіс
        </button>
      </div>

      {/* Services list */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-border)] py-16">
          <Zap size={32} className="text-[var(--color-border)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Ще немає сервісів</p>
          <button type="button" onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
            <Plus size={14} /> Додати перший сервіс
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {services
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((service) => {
              const catMeta = CAT_META[service.category] ?? CAT_META.production!;

              return (
                <motion.div key={service.id} layout
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl border bg-white p-4 transition hover:shadow-sm",
                    !service.is_active && "opacity-60",
                    service.is_active ? "border-[var(--color-border)]" : "border-dashed border-[var(--color-border)]",
                  )}>
                  {/* Drag handle */}
                  <GripVertical size={16} className="shrink-0 cursor-grab text-[var(--color-border)]" />

                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-2xl">
                    {service.icon ?? "🚪"}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--color-text-primary)]">{service.title}</p>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", catMeta.bg, catMeta.color)}>
                        {catMeta.label}
                      </span>
                      {service.is_featured && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          <Star size={9} /> Головна
                        </span>
                      )}
                    </div>
                    {service.tagline && (
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] italic">{service.tagline}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-[var(--color-text-secondary)]">
                      <span className="font-mono">/services/{service.slug}</span>
                      {service.price_from && <span>від {Number(service.price_from).toLocaleString("uk-UA")} {service.price_unit}</span>}
                      {(service.duration_days_from || service.duration_days_to) && (
                        <span>
                          {service.duration_days_from}–{service.duration_days_to} дн.
                        </span>
                      )}
                      <span>{service.features.length} переваг · {service.process_steps.length} кроків</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => toggleFeatured(service.id)}
                      title={service.is_featured ? "Прибрати з головної" : "Додати на головну"}
                      className={cn("rounded-xl border p-2 transition",
                        service.is_featured
                          ? "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-amber-300 hover:text-amber-600")}>
                      <Star size={14} />
                    </button>

                    <button type="button" onClick={() => toggleActive(service.id)}
                      title={service.is_active ? "Деактивувати" : "Активувати"}
                      className={cn("rounded-xl border p-2 transition",
                        service.is_active
                          ? "border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-emerald-300 hover:text-emerald-600")}>
                      {service.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    <button type="button" onClick={() => setEditService(service)}
                      className="rounded-xl border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                      <Pencil size={14} />
                    </button>

                    <button type="button" onClick={() => deleteService(service.id)}
                      className="rounded-xl border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] transition hover:border-red-300 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* Popups */}
      <ServiceFormPopup
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={onSaved}
      />

      {editService && (
        <ServiceFormPopup
          open={!!editService}
          onClose={() => setEditService(null)}
          initialData={editService as any}
          onSaved={(s) => { onSaved({ ...editService, ...s }); setEditService(null); }}
        />
      )}
    </div>
  );
}
