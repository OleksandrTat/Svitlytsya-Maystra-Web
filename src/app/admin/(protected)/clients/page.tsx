import Link from "next/link";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getClientsForAdmin } from "@/lib/data/queries";

type ClientSearchParams = {
  q?: string;
  segment?: "all" | "subscribers" | "buyers" | "leads";
  activity?: "all" | "active_30" | "inactive_30";
  sort?: "last_seen_desc" | "orders_desc" | "created_desc" | "name_asc";
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isActiveLast30Days(lastSeenAt: string) {
  const time = new Date(lastSeenAt).getTime();
  if (Number.isNaN(time)) {
    return false;
  }
  return Date.now() - time <= THIRTY_DAYS_MS;
}

function getClientBadges(client: { account_types: string[]; orders_count: number }) {
  const badges: string[] = [];

  if (client.account_types.includes("email_subscriber")) {
    badges.push("Підписник");
  }

  if (client.orders_count > 0) {
    badges.push("Покупець");
  } else {
    badges.push("Лід");
  }

  for (const accountType of client.account_types) {
    if (accountType === "email_subscriber") {
      continue;
    }

    badges.push(accountType);
  }

  return badges;
}

function applyClientFilters(
  clients: Awaited<ReturnType<typeof getClientsForAdmin>>,
  params: ClientSearchParams,
) {
  const query = (params.q ?? "").trim().toLowerCase();
  const segment = params.segment ?? "all";
  const activity = params.activity ?? "all";
  const sort = params.sort ?? "last_seen_desc";

  let filtered = [...clients];

  if (query) {
    filtered = filtered.filter((client) => {
      const name = (client.display_name ?? "").toLowerCase();
      return name.includes(query) || client.id.toLowerCase().includes(query);
    });
  }

  if (segment === "subscribers") {
    filtered = filtered.filter((client) => client.account_types.includes("email_subscriber"));
  } else if (segment === "buyers") {
    filtered = filtered.filter((client) => client.orders_count > 0);
  } else if (segment === "leads") {
    filtered = filtered.filter((client) => client.orders_count === 0);
  }

  if (activity === "active_30") {
    filtered = filtered.filter((client) => isActiveLast30Days(client.last_seen_at));
  } else if (activity === "inactive_30") {
    filtered = filtered.filter((client) => !isActiveLast30Days(client.last_seen_at));
  }

  filtered.sort((a, b) => {
    if (sort === "orders_desc") {
      return b.orders_count - a.orders_count || b.last_seen_at.localeCompare(a.last_seen_at);
    }

    if (sort === "created_desc") {
      return b.created_at.localeCompare(a.created_at);
    }

    if (sort === "name_asc") {
      return (a.display_name ?? "").localeCompare(b.display_name ?? "", "uk");
    }

    return b.last_seen_at.localeCompare(a.last_seen_at);
  });

  return filtered;
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<ClientSearchParams>;
}) {
  const params = await searchParams;
  const clients = await getClientsForAdmin(500);
  const filteredClients = applyClientFilters(clients, params);

  const totalClients = clients.length;
  const activeLast30 = clients.filter((client) => isActiveLast30Days(client.last_seen_at)).length;
  const buyers = clients.filter((client) => client.orders_count > 0).length;
  const subscribers = clients.filter((client) => client.account_types.includes("email_subscriber")).length;

  const dateTimeFormatter = new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <AdminShell title="Клієнти" description="Сегментація клієнтів, активність і швидкий перехід у профіль клієнта.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminCard className="p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Усього клієнтів</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">{totalClients}</p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Активні за 30 днів</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">{activeLast30}</p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Клієнти з замовленнями</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">{buyers}</p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Email-підписники</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">{subscribers}</p>
        </AdminCard>
      </div>

      <AdminCard>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <form className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--color-text-secondary)]">Пошук</label>
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Ім'я або ID"
                className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[var(--color-text-secondary)]">Сегмент</label>
              <select
                name="segment"
                defaultValue={params.segment ?? "all"}
                className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm"
              >
                <option value="all">Усі</option>
                <option value="subscribers">Підписники</option>
                <option value="buyers">Покупці</option>
                <option value="leads">Ліди</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[var(--color-text-secondary)]">Активність</label>
              <select
                name="activity"
                defaultValue={params.activity ?? "all"}
                className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm"
              >
                <option value="all">Будь-яка</option>
                <option value="active_30">Активні 30 днів</option>
                <option value="inactive_30">Неактивні 30+ днів</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[var(--color-text-secondary)]">Сортування</label>
              <select
                name="sort"
                defaultValue={params.sort ?? "last_seen_desc"}
                className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm"
              >
                <option value="last_seen_desc">Остання активність</option>
                <option value="orders_desc">Кількість замовлень</option>
                <option value="created_desc">Новіші акаунти</option>
                <option value="name_asc">Ім&apos;я (А-Я)</option>
              </select>
            </div>

            <button
              type="submit"
              className="h-10 rounded-lg border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
            >
              Застосувати
            </button>

            <Link
              href="/admin/clients"
              className="h-10 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
            >
              Скинути
            </Link>
          </form>

          <span className="ml-auto text-xs text-[var(--color-text-secondary)]">Показано: {filteredClients.length}</span>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Клієнт</th>
                <th className="px-2 py-2">Сегменти</th>
                <th className="px-2 py-2">Замовлення</th>
                <th className="px-2 py-2">Створено</th>
                <th className="px-2 py-2">Остання активність</th>
                <th className="px-2 py-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const displayName = client.display_name || "Без імені";
                const badges = getClientBadges(client);

                return (
                  <tr key={client.id} className="border-b border-[var(--color-border)]/60 align-top">
                    <td className="px-2 py-3">
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)]">
                          {displayName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">{displayName}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{client.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        {badges.map((badge) => (
                          <span
                            key={`${client.id}-${badge}`}
                            className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-2 py-3 font-medium text-[var(--color-text-primary)]">{client.orders_count}</td>
                    <td className="px-2 py-3 text-[var(--color-text-secondary)]">
                      {dateTimeFormatter.format(new Date(client.created_at))}
                    </td>
                    <td className="px-2 py-3 text-[var(--color-text-secondary)]">
                      {dateTimeFormatter.format(new Date(client.last_seen_at))}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
                      >
                        Відкрити
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                    За поточними фільтрами клієнтів не знайдено.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredClients.map((client) => {
            const displayName = client.display_name || "Без імені";
            const badges = getClientBadges(client);

            return (
              <article key={client.id} className="rounded-2xl border border-[var(--color-border)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">{displayName}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{client.id}</p>
                  </div>
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
                  >
                    Відкрити
                  </Link>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {badges.map((badge) => (
                    <span
                      key={`${client.id}-mobile-${badge}`}
                      className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
                  <p>Замовлення: {client.orders_count}</p>
                  <p>Активність: {dateTimeFormatter.format(new Date(client.last_seen_at))}</p>
                </div>
              </article>
            );
          })}

          {filteredClients.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-center text-sm text-[var(--color-text-secondary)]">
              За поточними фільтрами клієнтів не знайдено.
            </p>
          ) : null}
        </div>
      </AdminCard>
    </AdminShell>
  );
}
