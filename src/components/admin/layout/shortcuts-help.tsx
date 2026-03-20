"use client";

import { AnimatePresence, motion } from "framer-motion";

type ShortcutItem = {
  keys: string;
  description: string;
};

const shortcuts: ShortcutItem[] = [
  { keys: "Ctrl/Cmd + K", description: "Відкрити Command Palette" },
  { keys: "?", description: "Показати або сховати цю довідку" },
  { keys: "G then D", description: "Перейти на Dashboard" },
  { keys: "G then O", description: "Перейти до замовлень" },
  { keys: "G then I", description: "Перейти до заявок" },
  { keys: "G then C", description: "Перейти до клієнтів" },
  { keys: "G then M", description: "Перейти в Inbox" },
  { keys: "Esc", description: "Закрити модальне вікно" },
];

type ShortcutsHelpProps = {
  open: boolean;
  onClose: () => void;
};

export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/45" onClick={onClose} />
          <motion.div
            className="relative mx-auto mt-[12vh] w-[min(96vw,560px)] rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-xl"
            initial={{ scale: 0.96, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -8 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Keyboard shortcuts
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
              >
                Esc
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2"
                >
                  <span className="text-sm text-[var(--color-text-primary)]">
                    {shortcut.description}
                  </span>
                  <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg-section)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
