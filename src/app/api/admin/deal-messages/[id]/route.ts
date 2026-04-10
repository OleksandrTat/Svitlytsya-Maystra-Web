import { NextResponse } from "next/server";
import { getDealMessagesForAdmin } from "@/lib/data/queries";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const messages = await getDealMessagesForAdmin(id);
    return NextResponse.json(messages);
  } catch {
    return NextResponse.json([], { status: 401 });
  }
}
