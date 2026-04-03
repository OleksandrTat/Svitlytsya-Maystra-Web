import { redirect } from "next/navigation";
import { addClientOrderMessageAction } from "@/actions/orders";
import { Container } from "@/components/ui/container";
import { getClientOrderById, getClientOrderMessages } from "@/lib/data/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatInquiryDate } from "@/lib/utils";

type Params = {
  id: string;
};

export default async function ProfileOrderMessagesPage({
  params,
}: {
  params: Promise<Params>;
}) {
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

  const { id } = await params;
  const order = await getClientOrderById(id, user.id);

  if (!order) {
    redirect("/profile/orders");
  }

  const messages = await getClientOrderMessages(id, user.id);

  const sendMessage = async (formData: FormData) => {
    "use server";
    await addClientOrderMessageAction(formData);
  };

  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">
          Чат замовлення {order.order_number}
        </h1>

        <div className="mt-6 space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm ${
                message.sender_type === "client"
                  ? "ml-auto bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              }`}
            >
              <p className="mb-1 text-xs opacity-80">{message.sender_type}</p>
              <p>{message.content}</p>
              <p className="mt-2 text-[11px] opacity-70">{formatInquiryDate(message.created_at)}</p>
            </article>
          ))}

          {messages.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Повідомлень поки немає.</p>
          ) : null}
        </div>

        <form action={sendMessage} className="mt-4 space-y-3">
          <input type="hidden" name="order_id" value={order.id} />
          <textarea
            name="content"
            required
            rows={4}
            placeholder="Напишіть повідомлення майстерні..."
            className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white"
          >
            Надіслати
          </button>
        </form>
      </Container>
    </section>
  );
}
