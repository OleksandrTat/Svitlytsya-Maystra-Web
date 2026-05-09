// Inventory: count rows missing English translations.
// Read-only — does not modify the database.
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
  products:     { src: ["title","description","short_description","seo_title","seo_description"] },
  services:     { src: ["title","tagline","short_description","description","seo_title","seo_description"] },
  blog_posts:   { src: ["title","excerpt","content","seo_title","seo_description"] },
  testimonials: { src: ["content"] },
  faq_items:    { src: ["question","answer"] },
  certificates: { src: ["title","description","issuer"] },
};

for (const [table, { src }] of Object.entries(tables)) {
  const cols = src.flatMap((c) => [c, `${c}_en`]);
  const { data, error } = await supabase.from(table).select(`id, ${cols.join(",")}`);
  if (error) { console.log(`${table}: ERROR ${error.message}`); continue; }
  let totalRows = data.length;
  let perField = {};
  for (const row of data) {
    for (const c of src) {
      const ukVal = row[c];
      const enVal = row[`${c}_en`];
      const ukSet = typeof ukVal === "string" && ukVal.trim().length > 0;
      const enMissing = !(typeof enVal === "string" && enVal.trim().length > 0);
      if (ukSet && enMissing) {
        perField[c] = (perField[c] ?? 0) + 1;
      }
    }
  }
  console.log(`${table.padEnd(14)} rows=${String(totalRows).padStart(3)}  needs_en=${JSON.stringify(perField)}`);
}
