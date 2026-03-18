import { createSupabaseServiceClient } from "@/lib/supabase/server";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;

type RateLimitOptions = {
  windowMs?: number;
  maxRequests?: number;
};

export async function checkRateLimit(key: string, options?: RateLimitOptions): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return true;
  }

  const now = new Date();
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    const { data: existing } = await supabase
      .from("rate_limit_store")
      .select("timestamps")
      .eq("key", key)
      .maybeSingle();

    const allTimestamps: string[] = existing?.timestamps ?? [];

    const recent = allTimestamps.filter((timestamp) => new Date(timestamp) > windowStart);

    if (recent.length >= maxRequests) {
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
