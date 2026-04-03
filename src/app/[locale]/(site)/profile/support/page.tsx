import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { ProfileLayout } from "@/components/layout/profile-layout";
import { PageHero } from "@/components/ui/page-hero";
import { NewSupportChatForm } from "@/components/support/new-support-chat-form";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { formatInquiryDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
    <>
      <PageHero
        title="Підтримка"
        breadcrumbs={[
          { label: "Головна", href: "/" },
          { label: "Профіль", href: "/profile" },
          { label: "Підтримка" },
        ]}
        height="h-[180px]"
      />
      <ProfileLayout>
        <div className="space-y-8">
          {/* New chat form */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
              Нове звернення
            </h2>
            <div className="mt-4">
              <NewSupportChatForm />
            </div>
          </div>

          {/* Chat list */}
          {(chats ?? []).length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                Мої звернення
              </h2>
              <div className="mt-4 space-y-3">
                {(chats ?? []).map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/profile/support/${chat.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 transition-all hover:border-[var(--color-primary-100)] hover:shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
                      <MessageCircle size={18} className="text-[var(--color-primary)]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                        {chat.subject ?? "Без теми"}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatInquiryDate(chat.last_message_at)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        STATUS_COLORS[chat.status as keyof typeof STATUS_COLORS],
                      )}
                    >
                      {STATUS_LABELS[chat.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </ProfileLayout>
    </>
  );
}
