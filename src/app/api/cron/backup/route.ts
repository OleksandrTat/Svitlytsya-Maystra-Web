import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runBackupJob } from "@/lib/backup/run-backup";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const queryToken = new URL(request.url).searchParams.get("token")?.trim();

  if (!env.backupCronToken) {
    return false;
  }

  return headerToken === env.backupCronToken || queryToken === env.backupCronToken;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await runBackupJob("cron");
  const status = result.ok ? 200 : 500;

  return NextResponse.json(result, { status });
}
