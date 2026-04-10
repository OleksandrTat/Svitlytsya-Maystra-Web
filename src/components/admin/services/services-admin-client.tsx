"use client";

import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteServiceAction,
  toggleServiceActiveAction,
  toggleServiceFeaturedAction,
} from "@/actions/admin";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  services: Service[];
};

const CATEGORY_META: Record<string, string> = {
  production: "bg-amber-50 text-amber-700 border-amber-200",
  consultation: "bg-sky-50 text-sky-700 border-sky-200",
  installation: "bg-violet-50 text-violet-700 border-violet-200",
  restoration: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function ServicesAdminClient({ services: initialServices }: Props) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const sortedServices = [...services].sort((left, right) => left.sort_order - right.sort_order);

  const toggleActive = (service: Service) => {
    const nextValue = !service.is_active;
    setServices((current) =>
      current.map((item) => (item.id === service.id ? { ...item, is_active: nextValue } : item)),
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", service.id);
      formData.set("is_active", String(nextValue));

      try {
        const result = await toggleServiceActiveAction(formData);
        if (!result.ok) {
          setServices((current) =>
            current.map((item) =>
              item.id === service.id ? { ...item, is_active: service.is_active } : item,
            ),
          );
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
      } catch {
        setServices((current) =>
          current.map((item) =>
            item.id === service.id ? { ...item, is_active: service.is_active } : item,
          ),
        );
        toast.error("Не вдалося оновити статус сервісу");
      }
    });
  };

  const toggleFeatured = (service: Service) => {
    const nextValue = !service.is_featured;
    setServices((current) =>
      current.map((item) => (item.id === service.id ? { ...item, is_featured: nextValue } : item)),
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", service.id);
      formData.set("is_featured", String(nextValue));

      try {
        const result = await toggleServiceFeaturedAction(formData);
        if (!result.ok) {
          setServices((current) =>
            current.map((item) =>
              item.id === service.id ? { ...item, is_featured: service.is_featured } : item,
            ),
          );
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
      } catch {
        setServices((current) =>
          current.map((item) =>
            item.id === service.id ? { ...item, is_featured: service.is_featured } : item,
          ),
        );
        toast.error("Не вдалося оновити featured статус");
      }
    });
  };

  const removeService = (service: Service) => {
    if (!window.confirm(`Видалити сервіс "${service.title}"?`)) {
      return;
    }

    const previous = services;
    setServices((current) => current.filter((item) => item.id !== service.id));

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", service.id);

      try {
        const result = await deleteServiceAction(formData);
        if (!result.ok) {
          setServices(previous);
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
      } catch {
        setServices(previous);
        toast.error("Не вдалося видалити сервіс");
      }
    });
  };

  const stats = {
    total: services.length,
    active: services.filter((service) => service.is_active).length,
    featured: services.filter((service) => service.is_featured).length,
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(135deg,#18120d,#392312)] p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Services admin</p>
            <h2 className="mt-2 text-2xl font-semibold">Каталог сервісів</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Новий редактор сервісів з featured, SEO, етапами процесу і повним картковим списком.
            </p>
          </div>

          <Link
            href="/admin/services/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#402617]"
          >
            <Plus size={16} />
            Новий сервіс
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-semibold">{stats.total}</p>
            <p className="mt-1 text-sm text-white/60">Всього сервісів</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-semibold">{stats.active}</p>
            <p className="mt-1 text-sm text-white/60">Активні</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-semibold">{stats.featured}</p>
            <p className="mt-1 text-sm text-white/60">Featured</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sortedServices.map((service) => (
          <article
            key={service.id}
            className={cn(
              "grid gap-4 rounded-[24px] border bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto]",
              service.is_active ? "border-[var(--color-border)]" : "border-dashed border-[var(--color-border)] opacity-70",
            )}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-lg">
                  {service.icon ?? "🚪"}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{service.title}</h3>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        CATEGORY_META[service.category] ?? "border-[var(--color-border)] bg-[var(--color-surface)]",
                      )}
                    >
                      {service.category}
                    </span>
                    {service.is_featured ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  {service.tagline ? (
                    <p className="text-sm text-[var(--color-text-secondary)]">{service.tagline}</p>
                  ) : null}
                </div>
              </div>

              <p className="text-sm text-[var(--color-text-secondary)]">{service.short_description}</p>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className="rounded-full border border-[var(--color-border)] px-2 py-1">
                  /services/{service.slug}
                </span>
                {service.price_from ? (
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-1">
                    від {service.price_from.toLocaleString("uk-UA")} {service.price_unit ?? "грн"}
                  </span>
                ) : null}
                {service.duration_days_from ? (
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-1">
                    {service.duration_days_from}-{service.duration_days_to ?? service.duration_days_from} днів
                  </span>
                ) : null}
                <span className="rounded-full border border-[var(--color-border)] px-2 py-1">
                  {service.features.length} переваг
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:justify-center">
              <button
                type="button"
                onClick={() => toggleFeatured(service)}
                disabled={pending}
                className={cn(
                  "rounded-2xl border px-3 py-2 text-sm",
                  service.is_featured
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)]",
                )}
              >
                <Star size={14} className="inline" />
              </button>

              <button
                type="button"
                onClick={() => toggleActive(service)}
                disabled={pending}
                className={cn(
                  "rounded-2xl border px-3 py-2 text-sm",
                  service.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)]",
                )}
              >
                {service.is_active ? <Eye size={14} className="inline" /> : <EyeOff size={14} className="inline" />}
              </button>

              <Link
                href={`/admin/services/${service.id}/edit`}
                className="rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
              >
                <Pencil size={14} className="inline" />
              </Link>

              <Link
                href={`/services/${service.slug}`}
                target="_blank"
                className="rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
              >
                Preview
              </Link>

              <button
                type="button"
                onClick={() => removeService(service)}
                disabled={pending}
                className="rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
              >
                <Trash2 size={14} className="inline" />
              </button>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
}
