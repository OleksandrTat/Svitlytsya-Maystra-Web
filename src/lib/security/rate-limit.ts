import { createSupabaseServiceClient } from "@/lib/supabase/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

export async function checkRateLimit(key: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return true;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  try {
    const { data: existing } = await supabase
      .from("rate_limit_store")
      .select("timestamps")
      .eq("key", key)
      .maybeSingle();

    const allTimestamps: string[] = existing?.timestamps ?? [];

    const recent = allTimestamps.filter((timestamp) => new Date(timestamp) > windowStart);

    if (recent.length >= MAX_REQUESTS) {
      return false;
    }

    const updated = [...recent, now.toISOString()];

    await supabase
      .from("rate_limit_store")
      .upsert({
        key,
        timestamps: updated,
        updated_at: now.toISOString(),
      });

    return true;
  } catch {
    return true;
  }
}
