import "@supabase/auth-js";

declare module "@supabase/auth-js" {
  interface AuthClient {
    getUser(
      jwt?: string,
    ): Promise<{ data: { user: any | null }; error: any | null }>;
  }
}
