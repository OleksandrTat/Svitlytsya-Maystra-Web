"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  new: { bg: "#EBF4FF", border: "#2B6CB0" },
  consulting: { bg: "#EDF2FF", border: "#4C51BF" },
  design: { bg: "#FAF5FF", border: "#553C9A" },
  approved: { bg: "#F3E8FF", border: "#6B46C1" },
  production: { bg: "#FFFAF0", border: "#C05621" },
  ready: { bg: "#E6FFFA", border: "#2C7A7B" },
  installation: { bg: "#E6FFED", border: "#276749" },
  completed: { bg: "#F5F7FA", border: "#718096" },
  archived: { bg: "#EDF2F7", border: "#A0AEC0" },
};

export type GanttOrderBar = {
  id: string;
  orderNumber: string;
  clientName: string;
  status: string;
  serviceType: string;
  left: number;
  width: number;
  row: number;
  expectedDate: string | null;
};

export function GanttBar({ order }: { order: GanttOrderBar }) {
  const palette = STATUS_COLORS[order.status] ?? STATUS_COLORS.archived;

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 1, scaleX: 1 }}
      style={{
        position: "absolute",
        left: `${order.left}px`,
        width: `${Math.max(order.width, 96)}px`,
        top: `${order.row * 44 + 8}px`,
        height: "32px",
        backgroundColor: palette.bg,
        border: `1.5px solid ${palette.border}`,
        borderRadius: "8px",
      }}
      className="group"
    >
      <Link
        href={`/admin/orders/${order.id}`}
        className="flex h-full items-center gap-1.5 overflow-hidden px-2"
        title={`${order.clientName} · ${order.orderNumber} · ${order.serviceType}`}
      >
        <span className="truncate text-xs font-medium" style={{ color: palette.border }}>
          {order.clientName}
        </span>
        <span className="shrink-0 text-xs text-[var(--color-text-secondary)]">{order.orderNumber}</span>
      </Link>

      <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden min-w-[220px] rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs shadow-md group-hover:block">
        <p className="font-semibold text-[var(--color-text-primary)]">{order.clientName}</p>
        <p className="text-[var(--color-text-secondary)]">Послуга: {order.serviceType}</p>
        <p className="text-[var(--color-text-secondary)]">Статус: {order.status}</p>
        <p className="text-[var(--color-text-secondary)]">Дедлайн: {order.expectedDate ?? "-"}</p>
      </div>
    </motion.div>
  );
}
