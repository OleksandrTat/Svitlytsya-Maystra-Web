"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  current: "grid" | "list";
};

export function ProductsViewToggle({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = (view: "grid" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "grid") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const nextSearch = params.toString();
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  };

  return (
    <div className="flex rounded-lg border border-[var(--color-border)]">
      <button
        type="button"
        onClick={() => setView("grid")}
        className={cn(
          "flex items-center justify-center rounded-l-lg px-2.5 py-2 transition-colors",
          current === "grid"
            ? "bg-[var(--color-primary)] text-white"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]",
        )}
        title="Сітка"
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => setView("list")}
        className={cn(
          "flex items-center justify-center rounded-r-lg px-2.5 py-2 transition-colors",
          current === "list"
            ? "bg-[var(--color-primary)] text-white"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]",
        )}
        title="Список"
      >
        <List size={16} />
      </button>
    </div>
  );
}
