import { runBackupJob } from "../src/lib/backup/run-backup";

async function main() {
  const result = await runBackupJob("script");
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exit(1);
  }
}

void main();
