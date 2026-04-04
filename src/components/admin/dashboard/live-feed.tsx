"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Mail, MessageSquare, Workflow } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, formatInquiryDate } from "@/lib/utils";

export type FeedEventType = "inquiry" | "order_status" | "message";

export type FeedEvent = {
  id: string;
  type: FeedEventType;
  title: string;
  meta: string;
  href: string;
  time: string;
};

const eventTypeStyles: Record<FeedEventType, { icon: ComponentType<{ size?: number }>; chip: string }> = {
  inquiry: {
    icon: Mail,
    chip: "bg-sky-100 text-sky-700",
  },
  order_status: {
    icon: Workflow,
    chip: "bg-violet-100 text-violet-700",
  },
  message: {
    icon: MessageSquare,
    chip: "bg-emerald-100 text-emerald-700",
  },
};

function FeedItem({ event }: { event: FeedEvent }) {
  const style = eventTypeStyles[event.type];
  const Icon = style.icon;

  return (
    <Link
      href={event.href}
      className="flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--color-bg-section)]"
    >
      <span className={cn("mt-0.5 rounded-md p-2", style.chip)}>
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{event.title}</p>
        <p className="truncate text-xs text-[var(--color-text-secondary)]">{event.meta}</p>
      </div>
      <time className="shrink-0 text-[11px] text-[var(--color-text-secondary)]">
        {formatInquiryDate(event.time)}
      </time>
    </Link>
  );
}

export function LiveFeed({ initial }: { initial: FeedEvent[] }) {
  const [events, setEvents] = useState<FeedEvent[]>(initial);
  const t = useTranslations("admin.pages.dashboard");

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel("admin-live-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inquiries" },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as Record<string, unknown>;
          const inquiryId = String(row.id ?? "");
          const newEvent: FeedEvent = {
            id: `inq-${inquiryId}`,
            type: "inquiry",
            title: t("liveFeedInquiry", { name: String(row.name ?? "") }),
            meta: String(row.service_type ?? ""),
            href: "/admin/inquiries",
            time: new Date().toISOString(),
          };
          setEvents((prev) => [newEvent, ...prev].slice(0, 25));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_status_history" },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as Record<string, unknown>;
          const orderId = String(row.order_id ?? "");
          const status = String(row.to_status ?? "");
          const newEvent: FeedEvent = {
            id: `status-${String(row.id ?? orderId)}`,
            type: "order_status",
            title: t("liveFeedOrderStatus"),
            meta: t("liveFeedOrderStatusMeta", { status }),
            href: `/admin/orders/${orderId}`,
            time: new Date().toISOString(),
          };
          setEvents((prev) => [newEvent, ...prev].slice(0, 25));
        },
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_messages" }, (payload: { new: Record<string, unknown> }) => {
        const row = payload.new as Record<string, unknown>;
        if (row.sender_type !== "client") {
          return;
        }
        const orderId = String(row.order_id ?? "");
        const newEvent: FeedEvent = {
          id: `msg-${String(row.id ?? orderId)}`,
          type: "message",
          title: t("liveFeedMessage"),
          meta: String(row.content ?? "").slice(0, 80),
          href: `/admin/orders/${orderId}`,
          time: new Date().toISOString(),
        };
        setEvents((prev) => [newEvent, ...prev].slice(0, 25));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, t]);

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-section)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("liveFeedTitle")}</h3>
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <div className="max-h-[520px] divide-y divide-[var(--color-border)] overflow-y-auto">
        {events.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--color-text-secondary)]">{t("liveFeedEmpty")}</p>
        ) : (
          events.map((event) => <FeedItem key={event.id} event={event} />)
        )}
      </div>
    </section>
  );
}
