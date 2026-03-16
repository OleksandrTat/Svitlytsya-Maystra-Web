import "@supabase/supabase-js";

declare module "@supabase/supabase-js" {
  class SupabaseAuthClient {
    getUser(
      jwt?: string,
    ): Promise<{ data: { user: any | null }; error: any | null }>;
  }

  interface SupabaseClient<Database = any, SchemaName = any> {
    auth: any;
  }
}
