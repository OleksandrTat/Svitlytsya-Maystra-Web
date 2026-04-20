/**
 * Re-hash invitation tokens fallback script.
 *
 * The Phase-2 SQL migration backfills client_invitations.token_hash via
 * pgcrypto (encode(digest(token, 'sha256'), 'hex')). On Supabase this just
 * works, but if the target DB doesn't have pgcrypto enabled or the
 * migration ran before the plaintext column could be read, this script
 * can be executed to fill any still-empty token_hash values by reading
 * plaintext tokens client-side and writing sha256 hex.
 *
 * Safe to run multiple times: it only touches rows where token_hash is
 * NULL or starts with the sentinel prefix written by the migration.
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY (service role) in env. Uses the
 * same supabase service client the app uses, so plaintext tokens never
 * leave the server.
 *
 * Usage:
 *   npx tsx scripts/rehash-invitation-tokens.ts
 */

import { createHash } from "crypto";
import { createSupabaseServiceClient } from "../src/lib/supabase/server";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

async function main() {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.error("Service role supabase client not configured.");
    process.exit(1);
  }

  // Fetch candidates. If the column `token` has already been dropped by
  // the migration, this select will fail — in that case there's nothing
  // to rehash (pgcrypto handled it).
  const { data, error } = await supabase
    .from("client_invitations")
    .select("id, token, token_hash")
    .or("token_hash.is.null,token_hash.like.NULL_TOKEN_%");

  if (error) {
    if (/column .* token .* does not exist/i.test(error.message)) {
      console.log("Plaintext token column already dropped — nothing to rehash.");
      return;
    }
    console.error("Failed to read invitations:", error.message);
    process.exit(1);
  }

  const candidates = (data ?? []) as Array<{
    id: string;
    token: string | null;
    token_hash: string | null;
  }>;

  if (candidates.length === 0) {
    console.log("No invitations needing rehash.");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const row of candidates) {
    if (!row.token) {
      skipped += 1;
      continue;
    }
    const hash = sha256Hex(row.token);
    const { error: updError } = await supabase
      .from("client_invitations")
      .update({ token_hash: hash })
      .eq("id", row.id);

    if (updError) {
      console.warn(`Failed to update ${row.id}: ${updError.message}`);
      skipped += 1;
      continue;
    }
    updated += 1;
  }

  console.log(`Rehashed ${updated} invitation token(s), skipped ${skipped}.`);
}

void main();
