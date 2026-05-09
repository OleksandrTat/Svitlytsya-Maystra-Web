import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const envText = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data } = await supabase.from("testimonials").select("author_name, content, content_en");
for (const r of data) {
  console.log(`-- ${r.author_name}`);
  console.log(`UK: ${(r.content || "").slice(0, 80)}`);
  console.log(`EN: ${(r.content_en || "(empty)").slice(0, 80)}`);
  console.log("");
}
