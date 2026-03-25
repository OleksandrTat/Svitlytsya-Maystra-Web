"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode[];
  view: "grid" | "list";
};

export function ProductsGridClient({ children, view }: Props) {
  return (
    <div
      className={cn(
        "grid gap-5",
        view === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
      )}
    >
      <AnimatePresence mode="popLayout">
        {children.map((child, i) => (
          <motion.div
            key={(child as React.ReactElement)?.key ?? i}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
