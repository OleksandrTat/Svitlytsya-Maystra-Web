import { z } from "zod";
import { logger } from "@/lib/logger";

const DEFAULT_SITE_URL = "https://svitlytsya.ua";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default(DEFAULT_SITE_URL),
  BACKUP_S3_BUCKET: z.string().optional(),
  BACKUP_S3_REGION: z.string().optional(),
  BACKUP_S3_ACCESS_KEY: z.string().optional(),
  BACKUP_S3_SECRET_KEY: z.string().optional(),
  BACKUP_S3_ENDPOINT: z.string().url().optional(),
  BACKUP_S3_PREFIX: z.string().optional(),
  BACKUP_CRON_TOKEN: z.string().optional(),
  BACKUP_RETENTION_DAYS: z.coerce.number().int().positive().optional(),
  BACKUP_NOTIFY_EMAIL: z.string().email().optional(),
  SUPABASE_PROJECT_REF: z.string().optional(),
  SUPABASE_DB_PASSWORD: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),
  SUPABASE_DB_POOLER_HOST: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

const rawEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  BACKUP_S3_BUCKET: process.env.BACKUP_S3_BUCKET,
  BACKUP_S3_REGION: process.env.BACKUP_S3_REGION,
  BACKUP_S3_ACCESS_KEY: process.env.BACKUP_S3_ACCESS_KEY,
  BACKUP_S3_SECRET_KEY: process.env.BACKUP_S3_SECRET_KEY,
  BACKUP_S3_ENDPOINT: process.env.BACKUP_S3_ENDPOINT,
  BACKUP_S3_PREFIX: process.env.BACKUP_S3_PREFIX,
  BACKUP_CRON_TOKEN: process.env.BACKUP_CRON_TOKEN,
  BACKUP_RETENTION_DAYS: process.env.BACKUP_RETENTION_DAYS,
  BACKUP_NOTIFY_EMAIL: process.env.BACKUP_NOTIFY_EMAIL,
  SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF,
  SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  SUPABASE_DB_POOLER_HOST: process.env.SUPABASE_DB_POOLER_HOST,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
};

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success && process.env.NODE_ENV === "production") {
  logger.error("Invalid environment variables.", parsedEnv.error.flatten().fieldErrors);
}

function pickString<K extends keyof typeof rawEnv>(key: K) {
  if (parsedEnv.success) {
    return parsedEnv.data[key];
  }

  return rawEnv[key];
}

function getBackupRetentionDays() {
  if (parsedEnv.success) {
    return parsedEnv.data.BACKUP_RETENTION_DAYS;
  }

  const rawValue = rawEnv.BACKUP_RETENTION_DAYS;
  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}

function getSiteUrl() {
  if (parsedEnv.success) {
    return parsedEnv.data.NEXT_PUBLIC_SITE_URL;
  }

  return rawEnv.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
}

export const env = {
  supabaseUrl: pickString("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: pickString("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: pickString("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseProjectRef: pickString("SUPABASE_PROJECT_REF"),
  supabaseDbPassword: pickString("SUPABASE_DB_PASSWORD"),
  supabaseDbUrl: pickString("SUPABASE_DB_URL"),
  supabaseDbPoolerHost: pickString("SUPABASE_DB_POOLER_HOST"),
  openAiApiKey: pickString("OPENAI_API_KEY"),
  turnstileSecretKey: pickString("TURNSTILE_SECRET_KEY"),
  turnstileSiteKey: pickString("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
  resendApiKey: pickString("RESEND_API_KEY"),
  resendFromEmail: pickString("RESEND_FROM_EMAIL"),
  adminEmail: pickString("ADMIN_EMAIL"),
  backupCronToken: pickString("BACKUP_CRON_TOKEN"),
  backupRetentionDays: getBackupRetentionDays(),
  backupS3Bucket: pickString("BACKUP_S3_BUCKET"),
  backupS3Region: pickString("BACKUP_S3_REGION"),
  backupS3Endpoint: pickString("BACKUP_S3_ENDPOINT"),
  backupS3AccessKey: pickString("BACKUP_S3_ACCESS_KEY"),
  backupS3SecretKey: pickString("BACKUP_S3_SECRET_KEY"),
  backupS3Prefix: pickString("BACKUP_S3_PREFIX"),
  backupNotifyEmail: pickString("BACKUP_NOTIFY_EMAIL"),
  siteUrl: getSiteUrl(),
  posthogKey: pickString("NEXT_PUBLIC_POSTHOG_KEY"),
  posthogHost: pickString("NEXT_PUBLIC_POSTHOG_HOST"),
};

export const hasPostHog = Boolean(env.posthogKey);

export const hasSupabaseEnv = Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export const hasServiceRoleKey = hasSupabaseEnv && Boolean(env.supabaseServiceRoleKey);

export const hasEmailService = Boolean(env.resendApiKey);

export const hasAdminEmail = Boolean(env.adminEmail);

export const hasResend = hasEmailService;

export const hasBackupS3 =
  Boolean(env.backupS3Bucket) &&
  Boolean(env.backupS3Region) &&
  Boolean(env.backupS3AccessKey) &&
  Boolean(env.backupS3SecretKey);

export const hasOpenAi = Boolean(env.openAiApiKey);

export const hasSiteUrl = Boolean(env.siteUrl);

export const hasTurnstile =
  Boolean(env.turnstileSecretKey) && Boolean(env.turnstileSiteKey);
