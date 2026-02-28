"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar";
import { CommandPalette } from "@/components/admin/command-palette";
import { ShortcutsHelp } from "@/components/admin/layout/shortcuts-help";
import { useAdminShortcuts } from "@/hooks/use-admin-shortcuts";

type AdminWorkspaceClientProps = {
  title: string;
  description?: string;
  counts: {
    unreadMessages: number;
    newInquiries: number;
  };
  children: ReactNode;
};

export function AdminWorkspaceClient({
  title,
  description,
  counts,
  children,
}: AdminWorkspaceClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const shortcutHandlers = useMemo(
    () => ({
      onTogglePalette: () => setPaletteOpen((prev) => !prev),
      onToggleHelp: () => setHelpOpen((prev) => !prev),
    }),
    [],
  );

  useAdminShortcuts(shortcutHandlers);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-section)]">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        onOpenPalette={() => setPaletteOpen(true)}
        counts={counts}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="min-h-screen flex-1 overflow-y-auto p-5 md:p-7">
          <div className="mx-auto w-full max-w-[1400px] space-y-5">
            <header className="rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4">
              <h1 className="font-display text-3xl text-[var(--color-text-primary)]">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
              ) : null}
            </header>
            {children}
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
