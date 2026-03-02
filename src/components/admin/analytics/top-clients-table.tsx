import type { AnalyticsTopClient } from "@/lib/data/queries";

export function TopClientsTable({ clients }: { clients: AnalyticsTopClient[] }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <h3 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">
        Топ клієнтів
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
              <th className="px-2 py-2">Клієнт</th>
              <th className="px-2 py-2">Замовлення</th>
              <th className="px-2 py-2">Виручка</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.userId} className="border-b border-[var(--color-border)]/50">
                <td className="px-2 py-2">
                  <p className="font-medium text-[var(--color-text-primary)]">{client.displayName}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{client.userId}</p>
                </td>
                <td className="px-2 py-2">{client.orders}</td>
                <td className="px-2 py-2">{Math.round(client.revenue).toLocaleString("uk-UA")} грн</td>
              </tr>
            ))}
            {clients.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-2 py-4 text-sm text-[var(--color-text-secondary)]">
                  Поки немає достатньо даних.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
