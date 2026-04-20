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

  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  try {
    const { count } = await supabase
      .from("rate_limit_events")
      .select("id", { count: "exact", head: true })
      .eq("key", key)
      .gt("created_at", windowStart);

    if ((count ?? 0) >= maxRequests) {
      return false;
    }

    await supabase.from("rate_limit_events").insert({ key });

    return true;
  } catch {
    return true;
  }
}
