export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY,
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  adminEmail: process.env.ADMIN_EMAIL,
  backupCronToken: process.env.BACKUP_CRON_TOKEN,
  backupStorageBucket: process.env.BACKUP_STORAGE_BUCKET,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
};

export const hasSupabaseEnv =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export const hasServiceRoleKey =
  hasSupabaseEnv && Boolean(env.supabaseServiceRoleKey);

export const hasResend =
  Boolean(env.resendApiKey) && Boolean(env.resendFromEmail) && Boolean(env.adminEmail);

export const hasOpenAi = Boolean(env.openAiApiKey);

export const hasTurnstile =
  Boolean(env.turnstileSecretKey) && Boolean(env.turnstileSiteKey);

