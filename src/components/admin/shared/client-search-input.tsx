"use client";

import { useEffect, useRef, useState } from "react";
import { Search, User, X } from "lucide-react";
import type { ClientSummary } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

type Props = {
  clients: ClientSummary[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
};

export function ClientSearchInput({
  clients,
  value,
  onChange,
  placeholder = "Прив'язати клієнта...",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find((client) => client.id === value) ?? null;
  const filteredClients = clients.filter((client) => {
    const normalizedQuery = query.toLowerCase();
    return (
      (client.display_name ?? "").toLowerCase().includes(normalizedQuery) ||
      client.id.toLowerCase().includes(normalizedQuery)
    );
  });

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  if (selectedClient) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-primary-300)] text-xs font-semibold text-[var(--color-primary)]">
          {(selectedClient.display_name ?? "?").slice(0, 1).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {selectedClient.display_name ?? "Без імені"}
          </p>
          <p className="truncate text-[10px] text-[var(--color-text-secondary)]">
            {selectedClient.id}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-full p-0.5 hover:bg-[var(--color-border)]"
        >
          <X size={14} className="text-[var(--color-text-secondary)]" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2 transition",
          open
            ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-300)]"
            : "border-[var(--color-border)]",
        )}
      >
        <Search size={14} className="shrink-0 text-[var(--color-text-secondary)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
        />
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-52 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white shadow-lg">
          {filteredClients.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-[var(--color-text-secondary)]">
              {query ? "Клієнтів не знайдено" : "Немає зареєстрованих клієнтів"}
            </p>
          ) : (
            filteredClients.slice(0, 10).map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  onChange(client.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-[var(--color-surface)]"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-primary-100)] text-xs font-semibold text-[var(--color-primary)]">
                  {(client.display_name ?? "?").slice(0, 1).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {client.display_name ?? "Без імені"}
                  </p>
                  <p className="truncate text-[10px] text-[var(--color-text-secondary)]">
                    {client.id}
                  </p>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <User size={12} className="text-[var(--color-text-secondary)]" />
                  <span className="text-[10px] text-[var(--color-text-secondary)]">
                    {client.orders_count} замовл.
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
