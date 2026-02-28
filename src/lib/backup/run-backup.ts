import { spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Resend } from "resend";
import { env, hasBackupS3, hasResend } from "@/lib/env";

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

const DEFAULT_POOLER_HOST = "aws-0-eu-central-1.pooler.supabase.com";
const DEFAULT_RETENTION_DAYS = 30;
const SUPABASE_DUMP_TIMEOUT_MS = 10 * 60 * 1000;

function formatTimestamp(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function parseRetentionDays() {
  const value = Number(env.backupRetentionDays ?? DEFAULT_RETENTION_DAYS);
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_RETENTION_DAYS;
  }
  return Math.floor(value);
}

function resolveBackupS3Prefix() {
  const raw = env.backupS3Prefix?.trim();
  if (!raw) {
    return "db-backups";
  }
  return raw.replace(/^\/+|\/+$/g, "");
}

function resolveBackupDbUrl() {
  if (env.supabaseDbUrl?.trim()) {
    return env.supabaseDbUrl.trim();
  }

  if (!env.supabaseProjectRef || !env.supabaseDbPassword) {
    return null;
  }

  const host = env.supabaseDbPoolerHost || DEFAULT_POOLER_HOST;
  const username = `postgres.${env.supabaseProjectRef}`;
  const password = encodeURIComponent(env.supabaseDbPassword);

  return `postgresql://${username}:${password}@${host}:5432/postgres`;
}

function createS3Client() {
  if (!hasBackupS3) {
    return null;
  }

  return new S3Client({
    region: env.backupS3Region!,
    endpoint: env.backupS3Endpoint || undefined,
    forcePathStyle: Boolean(env.backupS3Endpoint),
    credentials: {
      accessKeyId: env.backupS3AccessKey!,
      secretAccessKey: env.backupS3SecretKey!,
    },
  });
}

async function cleanupOldBackups(s3: S3Client, bucket: string, prefix: string) {
  const retentionDays = parseRetentionDays();
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let continuationToken: string | undefined;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${prefix}/`,
        ContinuationToken: continuationToken,
      }),
    );

    const staleKeys = (list.Contents ?? [])
      .filter((item) => item.Key && item.LastModified)
      .filter((item) => (item.LastModified?.getTime() ?? Date.now()) < cutoff)
      .map((item) => ({ Key: item.Key! }));

    if (staleKeys.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: staleKeys, Quiet: true },
        }),
      );
    }

    continuationToken = list.NextContinuationToken;
  } while (continuationToken);
}

async function sendBackupEmail(result: BackupRunResult) {
  if (!hasResend) {
    return;
  }

  const recipient = env.backupNotifyEmail || env.adminEmail;
  if (!recipient) {
    return;
  }

  const resend = new Resend(env.resendApiKey!);
  const subject = result.ok ? "Backup OK" : "Backup FAILED";

  await resend.emails.send({
    from: env.resendFromEmail!,
    to: recipient,
    subject: `[Svitlytsya Backup] ${subject}`,
    text: [
      `Source: ${result.source}`,
      `Started: ${result.startedAt}`,
      `Finished: ${result.finishedAt}`,
      `Message: ${result.message}`,
      result.filePath ? `File: ${result.filePath}` : "",
      result.errors?.length ? `Errors:\n${result.errors.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function runBackupJob(source: BackupSource): Promise<BackupRunResult> {
  const startedAt = new Date();
  const startedAtIso = startedAt.toISOString();
  const errors: string[] = [];

  const dbUrl = resolveBackupDbUrl();
  if (!dbUrl) {
    const result: BackupRunResult = {
      ok: false,
      source,
      startedAt: startedAtIso,
      finishedAt: new Date().toISOString(),
      message:
        "Backup skipped: set SUPABASE_DB_URL or SUPABASE_PROJECT_REF + SUPABASE_DB_PASSWORD.",
    };
    await sendBackupEmail(result);
    return result;
  }

  const s3 = createS3Client();
  if (!s3) {
    const result: BackupRunResult = {
      ok: false,
      source,
      startedAt: startedAtIso,
      finishedAt: new Date().toISOString(),
      message:
        "Backup skipped: missing BACKUP_S3_BUCKET/BACKUP_S3_REGION/BACKUP_S3_ACCESS_KEY/BACKUP_S3_SECRET_KEY.",
    };
    await sendBackupEmail(result);
    return result;
  }

  const bucket = env.backupS3Bucket!;
  const prefix = resolveBackupS3Prefix();
  const stamp = formatTimestamp(startedAt);
  const fileName = `backup-${stamp}.sql.gz`;
  const filePath = `${prefix}/${fileName}`;
  const sqlPath = path.join(os.tmpdir(), `backup-${stamp}.sql`);
  const gzPath = path.join(os.tmpdir(), fileName);

  try {
    const dump = spawnSync(
      "supabase",
      ["db", "dump", "--db-url", dbUrl, "--schema", "public", "--file", sqlPath],
      {
        encoding: "utf8",
        timeout: SUPABASE_DUMP_TIMEOUT_MS,
      },
    );

    if (dump.error) {
      throw dump.error;
    }

    if (dump.status !== 0) {
      throw new Error(dump.stderr || dump.stdout || "supabase db dump failed");
    }

    const sqlContents = await readFile(sqlPath);
    if (sqlContents.length === 0) {
      throw new Error("supabase db dump returned an empty file");
    }

    const gzipBuffer = gzipSync(sqlContents);
    await writeFile(gzPath, gzipBuffer);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: filePath,
        Body: gzipBuffer,
        ContentType: "application/gzip",
      }),
    );

    await cleanupOldBackups(s3, bucket, prefix);

    const result: BackupRunResult = {
      ok: true,
      source,
      startedAt: startedAtIso,
      finishedAt: new Date().toISOString(),
      filePath,
      message: `Backup uploaded to ${bucket}/${filePath}`,
    };

    await sendBackupEmail(result);
    return result;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));

    const result: BackupRunResult = {
      ok: false,
      source,
      startedAt: startedAtIso,
      finishedAt: new Date().toISOString(),
      message: "Backup failed while generating or uploading pg_dump archive.",
      errors,
    };

    await sendBackupEmail(result);
    return result;
  } finally {
    await Promise.allSettled([
      rm(sqlPath, { force: true }),
      rm(gzPath, { force: true }),
    ]);
  }
}
