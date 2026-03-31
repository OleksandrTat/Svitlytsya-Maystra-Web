"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Search, UserMinus } from "lucide-react";
import { unsubscribeFromNewsletterAction } from "@/actions/newsletter";
import { exportToCSV } from "@/lib/admin/export";
import type { NewsletterSubscriber } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  active: "Активний",
  unsubscribed: "Відписаний",
  bounced: "Bounced",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  unsubscribed: "bg-zinc-100 text-zinc-600",
  bounced: "bg-red-100 text-red-700",
};

export function NewsletterAdminClient({
  subscribers: initial,
}: {
  subscribers: NewsletterSubscriber[];
}) {
  const [subscribers, setSubscribers] = useState(initial);
  const [filter, setFilter] = useState<"all" | "active" | "unsubscribed">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeCount = subscribers.filter((s) => s.status === "active").length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newLast7Days = subscribers.filter(
    (s) =>
      s.status === "active" && new Date(s.subscribed_at) >= weekAgo,
  ).length;
  const unsubRate =
    subscribers.length > 0
      ? (
          (subscribers.filter((s) => s.status === "unsubscribed").length /
            subscribers.length) *
          100
        ).toFixed(1)
      : "0";

  const filtered = useMemo(() => {
    let result = subscribers;
    if (filter !== "all") {
      result = result.filter((s) => s.status === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.email.toLowerCase().includes(q) ||
          (s.name && s.name.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [subscribers, filter, search]);

  const handleUnsubscribe = (email: string) => {
    startTransition(async () => {
      const result = await unsubscribeFromNewsletterAction(email);
      if (result.ok) {
        toast.success("Відписано");
        setSubscribers((prev) =>
          prev.map((s) =>
            s.email === email
              ? { ...s, status: "unsubscribed" as const }
              : s,
          ),
        );
      }
    });
  };

  const handleExport = () => {
    exportToCSV(
      filtered as unknown as Record<string, unknown>[],
      [
        { key: "email", label: "Email" },
        { key: "name", label: "Ім'я" },
        { key: "status", label: "Статус" },
        { key: "source", label: "Джерело" },
        { key: "subscribed_at", label: "Дата підписки" },
      ],
      "newsletter_subscribers",
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            Активних підписників
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            Нових за 7 днів
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            +{newLast7Days}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            Відписка %
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
            {unsubRate}%
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="Пошук по email чи імені..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        <div className="flex gap-1">
          {(["all", "active", "unsubscribed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                filter === f
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)]"
              }`}
            >
              {f === "all" ? "Всі" : f === "active" ? "Активні" : "Відписані"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium transition hover:bg-[var(--color-bg-warm)]"
        >
          <Download size={14} />
          CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Ім&apos;я</th>
                <th className="px-5 py-3 font-medium">Джерело</th>
                <th className="px-5 py-3 font-medium">Дата</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((sub) => (
                <tr key={sub.id} className="group">
                  <td className="px-5 py-3 font-medium text-[var(--color-text-primary)]">
                    {sub.email}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-secondary)]">
                    {sub.name || "—"}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {sub.source || "—"}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {new Date(sub.subscribed_at).toLocaleDateString("uk-UA")}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[sub.status] ?? ""}`}
                    >
                      {STATUS_LABELS[sub.status] ?? sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {sub.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleUnsubscribe(sub.email)}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-[var(--color-text-muted)] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
                        title="Відписати"
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
            Немає підписників
          </div>
        )}
      </div>
    </div>
  );
}
