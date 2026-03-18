import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { formatInquiryDate } from "@/lib/utils";
import { NewSupportChatForm } from "@/components/support/new-support-chat-form";

const STATUS_LABELS = {
  open: "Відкрито",
  waiting: "Очікує відповіді",
  resolved: "Вирішено",
  closed: "Закрито",
};

const STATUS_COLORS = {
  open: "bg-green-100 text-green-800",
  waiting: "bg-amber-100 text-amber-800",
  resolved: "bg-zinc-100 text-zinc-600",
  closed: "bg-zinc-100 text-zinc-500",
};

export default async function ProfileSupportPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const readClient = createSupabaseServiceClient() ?? supabase;
  const { data: chats } = await readClient
    .from("support_chats")
    .select("*")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false });

  return (
    <section className="py-16">
      <Container>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Підтримка</h1>
          <Link href="/profile" className="text-sm underline">
            До профілю
          </Link>
        </div>

        <NewSupportChatForm />

        {(chats ?? []).length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Мої звернення</h2>
            {(chats ?? []).map((chat) => (
              <Link
                key={chat.id}
                href={`/profile/support/${chat.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 hover:bg-[var(--color-surface)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {chat.subject ?? "Без теми"}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {formatInquiryDate(chat.last_message_at)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    STATUS_COLORS[chat.status as keyof typeof STATUS_COLORS]
                  }`}
                >
                  {STATUS_LABELS[chat.status as keyof typeof STATUS_LABELS]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
