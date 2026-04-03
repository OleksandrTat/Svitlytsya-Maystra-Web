import type { ReactNode } from "react";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type ProfileLayoutProps = {
  children: ReactNode;
};

export default async function ProfileLayout({ children }: ProfileLayoutProps) {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const serviceClient = createSupabaseServiceClient();

      if (serviceClient) {
        void serviceClient
          .from("user_profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    }
  }

  return children;
}
