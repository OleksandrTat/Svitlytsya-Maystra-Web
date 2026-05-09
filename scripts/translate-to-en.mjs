// Translate all content fields from Ukrainian to English using gpt-4o-mini.
// Overwrites existing *_en fields. Run backup-en-fields.mjs first.
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

const OPENAI_KEY = process.env.OPENAI_API_KEY;

const tables = {
  products:     ["title","description","short_description","seo_title","seo_description"],
  services:     ["title","tagline","short_description","description","seo_title","seo_description"],
  blog_posts:   ["title","excerpt","content","seo_title","seo_description"],
  testimonials: ["content"],
  faq_items:    ["question","answer"],
  certificates: ["title","description","issuer"],
};

const SYSTEM_PROMPT = `You translate Ukrainian marketing copy for a custom woodworking workshop ("Svitlytsya Maystra") into natural, professional English.

Rules:
- Keep the tone warm, confident, and professional — this is a craft business, not a tech startup.
- Preserve markdown formatting (**, lists, headings, links) exactly as in the source.
- Keep proper nouns unchanged: "Svitlytsya Maystra", model names like "Classic Minimal 3P White", "Modern Oak", "Komfort", "Lofts", etc. Cyrillic-only product names (e.g. "Колодязь декоративний сосновий") may be transliterated or translated naturally.
- Keep numerical values, prices, units, dates, URLs and email/phone literals intact.
- For SEO titles/descriptions: keep them concise and keyword-rich, do not exceed the original length by more than 10%.
- For client testimonials: preserve the speaker's voice and any emotional tone; do not formalize.
- Output ONLY a JSON object whose keys match the requested field names and whose values are the translated strings. Do not add any other keys, comments, or wrapping.`;

async function translateRow(table, fields) {
  const userPayload = {
    table,
    fields_to_translate: fields,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(userPayload, null, 2) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return JSON.parse(content);
}

let totalRows = 0;
let totalFields = 0;
let errors = [];

for (const [table, srcCols] of Object.entries(tables)) {
  const cols = ["id", ...srcCols];
  const { data, error } = await supabase.from(table).select(cols.join(","));
  if (error) { console.log(`${table}: SELECT ERROR ${error.message}`); continue; }

  console.log(`\n=== ${table} (${data.length} rows) ===`);

  for (const row of data) {
    const fieldsToTranslate = {};
    for (const c of srcCols) {
      const v = row[c];
      if (typeof v === "string" && v.trim().length > 0) {
        fieldsToTranslate[c] = v;
      }
    }
    if (Object.keys(fieldsToTranslate).length === 0) {
      console.log(`  ${row.id}: no source content, skip`);
      continue;
    }

    try {
      const translated = await translateRow(table, fieldsToTranslate);
      const update = {};
      for (const c of Object.keys(fieldsToTranslate)) {
        const t = translated[c];
        if (typeof t === "string" && t.trim().length > 0) {
          update[`${c}_en`] = t.trim();
        }
      }

      if (Object.keys(update).length === 0) {
        console.log(`  ${row.id}: empty translation, skip`);
        continue;
      }

      const { error: updErr } = await supabase
        .from(table)
        .update(update)
        .eq("id", row.id);

      if (updErr) {
        console.log(`  ${row.id}: UPDATE ERROR ${updErr.message}`);
        errors.push({ table, id: row.id, error: updErr.message });
      } else {
        totalRows++;
        totalFields += Object.keys(update).length;
        const preview = update.title_en || update.question_en || update.content_en || Object.values(update)[0];
        console.log(`  ${row.id}: ✓ ${Object.keys(update).length} fields — ${preview.slice(0, 60)}`);
      }
    } catch (e) {
      console.log(`  ${row.id}: TRANSLATE ERROR ${e.message}`);
      errors.push({ table, id: row.id, error: e.message });
    }
  }
}

console.log(`\n\nDone. Updated ${totalRows} rows, ${totalFields} fields total.`);
if (errors.length) {
  console.log(`\n${errors.length} errors:`);
  for (const e of errors) console.log(` - ${e.table}/${e.id}: ${e.error}`);
}
