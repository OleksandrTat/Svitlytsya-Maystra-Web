export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseProjectRef: process.env.SUPABASE_PROJECT_REF,
  supabaseDbPassword: process.env.SUPABASE_DB_PASSWORD,
  supabaseDbUrl: process.env.SUPABASE_DB_URL,
  supabaseDbPoolerHost: process.env.SUPABASE_DB_POOLER_HOST,
  openAiApiKey: process.env.OPENAI_API_KEY,
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  adminEmail: process.env.ADMIN_EMAIL,
  backupCronToken: process.env.BACKUP_CRON_TOKEN,
  backupRetentionDays: process.env.BACKUP_RETENTION_DAYS,
  backupS3Bucket: process.env.BACKUP_S3_BUCKET,
  backupS3Region: process.env.BACKUP_S3_REGION,
  backupS3Endpoint: process.env.BACKUP_S3_ENDPOINT,
  backupS3AccessKey: process.env.BACKUP_S3_ACCESS_KEY,
  backupS3SecretKey: process.env.BACKUP_S3_SECRET_KEY,
  backupS3Prefix: process.env.BACKUP_S3_PREFIX,
  backupNotifyEmail: process.env.BACKUP_NOTIFY_EMAIL,
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

export const hasBackupS3 =
  Boolean(env.backupS3Bucket) &&
  Boolean(env.backupS3Region) &&
  Boolean(env.backupS3AccessKey) &&
  Boolean(env.backupS3SecretKey);

export const hasOpenAi = Boolean(env.openAiApiKey);

export const hasTurnstile =
  Boolean(env.turnstileSecretKey) && Boolean(env.turnstileSiteKey);

