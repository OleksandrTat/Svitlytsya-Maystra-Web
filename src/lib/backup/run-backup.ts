import { gzipSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { env, hasResend, hasServiceRoleKey } from "@/lib/env";

const BACKUP_RETENTION_DAYS = 30;
const BACKUP_TABLES = [
  "site_settings",
  "services",
  "projects",
  "inquiries",
  "orders",
  "order_status_history",
  "order_messages",
  "price_presets",
  "price_formulas",
  "formula_components",
  "audit_log",
  "blog_posts",
  "cultural_blog_posts",
  "blog_comments",
  "email_subscribers",
] as const;

type BackupSource = "cron" | "script" | "manual";

export type BackupRunResult = {
  ok: boolean;
  source: BackupSource;
  startedAt: string;
  finishedAt: string;
  filePath?: string;
  message: string;
  errors?: string[];
};

function getBackupClient() {
  if (!hasServiceRoleKey) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function backupFilename(now: Date) {
  const iso = now.toISOString().replace(/[:.]/g, "-");
  return `db/backup-${iso}.json.gz`;
}

async function cleanupOldBackups(bucket: string) {
  const client = getBackupClient();
  if (!client) {
    return;
  }

  const { data, error } = await client.storage.from(bucket).list("db", {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error || !data?.length) {
    return;
  }

  const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const stale = data
    .filter((item) => {
      if (!item.created_at) {
        return false;
      }
      return new Date(item.created_at).getTime() < cutoff;
    })
    .map((item) => `db/${item.name}`);

  if (!stale.length) {
    return;
  }

  await client.storage.from(bucket).remove(stale);
}

async function sendBackupEmail(result: BackupRunResult) {
  if (!hasResend) {
    return;
  }

  const resend = new Resend(env.resendApiKey!);
  const title = result.ok ? "Backup OK" : "Backup FAILED";

  await resend.emails.send({
    from: env.resendFromEmail!,
    to: env.adminEmail!,
    subject: `[Svitlytsya] ${title}`,
    html: `
      <h2>${title}</h2>
      <p><strong>Source:</strong> ${result.source}</p>
      <p><strong>Started:</strong> ${result.startedAt}</p>
      <p><strong>Finished:</strong> ${result.finishedAt}</p>
      <p><strong>Message:</strong> ${result.message}</p>
      ${result.filePath ? `<p><strong>File:</strong> ${result.filePath}</p>` : ""}
      ${result.errors?.length ? `<pre>${result.errors.join("\n")}</pre>` : ""}
    `,
  });
}

export async function runBackupJob(source: BackupSource): Promise<BackupRunResult> {
  const startedAt = new Date();
  const errors: string[] = [];
  const bucket = env.backupStorageBucket || "backups";

  const client = getBackupClient();
  if (!client) {
    const result: BackupRunResult = {
      ok: false,
      source,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      message:
        "Backup skipped: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    };
    await sendBackupEmail(result);
    return result;
  }

  const tableSnapshots: Record<string, unknown[]> = {};

  for (const table of BACKUP_TABLES) {
    const { data, error } = await client.from(table).select("*");
    if (error) {
      errors.push(`${table}: ${error.message}`);
      continue;
    }
    tableSnapshots[table] = data ?? [];
  }

  if (errors.length) {
    const result: BackupRunResult = {
      ok: false,
      source,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      message: "Backup failed while reading one or more tables.",
      errors,
    };
    await sendBackupEmail(result);
    return result;
  }

  const payload = {
    generated_at: startedAt.toISOString(),
    source,
    tables: tableSnapshots,
  };

  const compressed = gzipSync(Buffer.from(JSON.stringify(payload), "utf8"));
  const filePath = backupFilename(startedAt);

  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(filePath, compressed, {
      contentType: "application/gzip",
      upsert: false,
    });

  if (uploadError) {
    const result: BackupRunResult = {
      ok: false,
      source,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      message: `Backup upload failed: ${uploadError.message}`,
    };
    await sendBackupEmail(result);
    return result;
  }

  await cleanupOldBackups(bucket);

  const result: BackupRunResult = {
    ok: true,
    source,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    filePath,
    message: `Backup uploaded to bucket "${bucket}".`,
  };

  await sendBackupEmail(result);

  return result;
}
