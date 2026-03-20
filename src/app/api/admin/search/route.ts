import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/is-admin";

type SearchResponseItem = {
  id: string;
  type: "order" | "client" | "inquiry";
  icon: "package" | "user" | "mail";
  title: string;
  meta: string;
  href: string;
};

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const term = `%${query}%`;
  const db = createSupabaseServiceClient() ?? supabase;

  const [ordersResult, clientsResult, inquiriesResult] = await Promise.all([
    db
      .from("orders")
      .select("id, order_number, status")
      .ilike("order_number", term)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("user_profiles")
      .select("id, display_name")
      .ilike("display_name", term)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("inquiries")
      .select("id, name, phone, service_type, created_at")
      .or(`name.ilike.${term},phone.ilike.${term}`)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const results: SearchResponseItem[] = [
    ...(ordersResult.data ?? []).map((order) => ({
      id: order.id,
      type: "order" as const,
      icon: "package" as const,
      title: order.order_number,
      meta: `Замовлення • ${order.status}`,
      href: `/admin/orders/${order.id}`,
    })),
    ...(clientsResult.data ?? []).map((client) => ({
      id: client.id,
      type: "client" as const,
      icon: "user" as const,
      title: client.display_name ?? `Клієнт ${client.id.slice(0, 8)}`,
      meta: "Профіль клієнта",
      href: `/admin/clients/${client.id}`,
    })),
    ...(inquiriesResult.data ?? []).map((inquiry) => ({
      id: inquiry.id,
      type: "inquiry" as const,
      icon: "mail" as const,
      title: `Заявка від ${inquiry.name}`,
      meta: `${inquiry.service_type} • ${inquiry.phone ?? "без телефону"}`,
      href: `/admin/inquiries#${inquiry.id}`,
    })),
  ];

  return NextResponse.json(results);
}
