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

console.log("=== sample products ===");
const { data: p } = await supabase
  .from("products")
  .select("title, title_en, short_description, short_description_en")
  .limit(3);
for (const r of p) console.log(JSON.stringify(r, null, 2), "\n");

console.log("=== sample faq ===");
const { data: f } = await supabase
  .from("faq_items")
  .select("question, question_en, answer, answer_en")
  .limit(2);
for (const r of f) console.log(JSON.stringify(r, null, 2), "\n");

console.log("=== sample testimonial ===");
const { data: t } = await supabase
  .from("testimonials")
  .select("content, content_en")
  .limit(2);
for (const r of t) console.log(JSON.stringify(r, null, 2), "\n");
