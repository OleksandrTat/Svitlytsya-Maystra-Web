import Link from "next/link";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getChatMessagesForAdmin, getChatSessionsForAdmin } from "@/lib/data/queries";
import { cn, formatInquiryDate } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedSessionId = typeof params.session === "string" ? params.session : undefined;
  const sessions = await getChatSessionsForAdmin(100);
  const activeSession =
    sessions.find((session) => session.id === selectedSessionId) ?? sessions[0] ?? null;
  const messages = activeSession ? await getChatMessagesForAdmin(activeSession.id, 200) : [];

  return (
    <AdminShell
      title="AI Chat"
      description="Історія чат-сесій з віджета. Оберіть сесію, щоб переглянути діалог."
    >
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <AdminCard className="p-0">
          <div className="max-h-[72vh] overflow-y-auto p-3">
            {sessions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-secondary)]">
                Поки що немає збережених чат-сесій.
              </p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((session) => {
                  const isActive = activeSession?.id === session.id;
                  return (
                    <li key={session.id}>
                      <Link
                        href={`/admin/chat?session=${session.id}`}
                        className={cn(
                          "block rounded-2xl border px-3 py-3 text-sm transition",
                          isActive
                            ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
                            : "border-[var(--color-border)] hover:bg-[var(--color-surface)]",
                        )}
                      >
                        <p className="font-medium text-[var(--color-text-primary)]">
                          Session: {session.session_id.slice(0, 16)}...
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          Messages: {session.messages_count}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Language: {session.language}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          {formatInquiryDate(session.last_message_at)}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          {!activeSession ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Оберіть сесію зліва, щоб переглянути повідомлення.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-[var(--color-border)] pb-3">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Session ID: {activeSession.session_id}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Last message: {formatInquiryDate(activeSession.last_message_at)}
                </p>
              </div>

              <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    У цій сесії ще немає повідомлень.
                  </p>
                ) : (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={cn(
                        "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        message.role === "assistant"
                          ? "bg-[var(--color-surface)]"
                          : "ml-auto bg-[var(--color-primary)] text-white",
                      )}
                    >
                      <p className="mb-1 text-[11px] uppercase tracking-wide opacity-70">
                        {message.role}
                      </p>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="mt-2 text-[11px] opacity-70">
                        {formatInquiryDate(message.created_at)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </AdminCard>
      </div>
    </AdminShell>
  );
}
