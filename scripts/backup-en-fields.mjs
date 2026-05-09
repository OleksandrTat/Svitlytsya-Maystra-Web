// Backup all current *_en fields to a JSON file before overwriting.
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

const tables = {
  products:     ["title_en","description_en","short_description_en","seo_title_en","seo_description_en"],
  services:     ["title_en","tagline_en","short_description_en","description_en","seo_title_en","seo_description_en"],
  blog_posts:   ["title_en","excerpt_en","content_en","seo_title_en","seo_description_en"],
  testimonials: ["content_en"],
  faq_items:    ["question_en","answer_en"],
  certificates: ["title_en","description_en","issuer_en"],
};

const backup = {};
for (const [table, cols] of Object.entries(tables)) {
  const { data, error } = await supabase.from(table).select(`id, ${cols.join(",")}`);
  if (error) { console.log(`${table}: ERROR ${error.message}`); continue; }
  backup[table] = data;
  console.log(`${table}: ${data.length} rows backed up`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const out = `scripts/backup-en-fields-${stamp}.json`;
fs.writeFileSync(out, JSON.stringify(backup, null, 2), "utf8");
console.log(`\nBackup saved to ${out}`);
