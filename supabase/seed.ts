import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

function loadEnvFromFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

for (const envPath of [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
]) {
  loadEnvFromFile(envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = new Date().toISOString();

const media = {
  doorHero:
    "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1600&q=80",
  doorDetail:
    "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1600&q=80",
  kitchenHero:
    "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=80",
  kitchenDetail:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  wardrobeHero:
    "https://images.unsplash.com/photo-1616594039964-3ad6f5f1f5f5?auto=format&fit=crop&w=1600&q=80",
  windowHero:
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
  windowDetail:
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
  restorationHero:
    "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?auto=format&fit=crop&w=1600&q=80",
  workshop:
    "https://images.unsplash.com/photo-1452457750107-c7d7f65d8a3f?auto=format&fit=crop&w=1600&q=80",
  teamOne:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  teamTwo:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
};

const fixedIds = {
  inquiryDoor: "30000000-0000-4000-8000-000000000001",
  inquiryKitchen: "30000000-0000-4000-8000-000000000002",
  inquiryWindow: "30000000-0000-4000-8000-000000000003",
  aiSessionDoor: "40000000-0000-4000-8000-000000000001",
  aiMessageDoor1: "41000000-0000-4000-8000-000000000001",
  aiMessageDoor2: "41000000-0000-4000-8000-000000000002",
  aiMessageDoor3: "41000000-0000-4000-8000-000000000003",
  testimonialDoor: "20000000-0000-4000-8000-000000000001",
  testimonialKitchen: "20000000-0000-4000-8000-000000000002",
  testimonialWindow: "20000000-0000-4000-8000-000000000003",
  orderMessage1: "82000000-0000-4000-8000-000000000001",
  orderMessage2: "82000000-0000-4000-8000-000000000002",
  orderMessage3: "82000000-0000-4000-8000-000000000003",
  orderHistory1: "83000000-0000-4000-8000-000000000001",
  orderHistory2: "83000000-0000-4000-8000-000000000002",
  orderHistory3: "83000000-0000-4000-8000-000000000003",
  orderHistory4: "83000000-0000-4000-8000-000000000004",
  orderHistory5: "83000000-0000-4000-8000-000000000005",
  orderItem1: "84000000-0000-4000-8000-000000000001",
  orderItem2: "84000000-0000-4000-8000-000000000002",
  orderItem3: "84000000-0000-4000-8000-000000000003",
  companyInfo: "85000000-0000-4000-8000-000000000001",
};

function isSchemaOptionalError(error: { code?: string; message?: string; details?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  if (["42P01", "42703", "PGRST204", "PGRST205"].includes(String(error.code ?? ""))) {
    return true;
  }

  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    text.includes("does not exist") ||
    text.includes("could not find the table") ||
    text.includes("could not find the '") ||
    text.includes("column") ||
    text.includes("relation")
  );
}

async function upsertRows(options: {
  table: string;
  rows: Row[];
  onConflict: string;
  label?: string;
  optional?: boolean;
}) {
  const { table, rows, onConflict, label = table, optional = false } = options;
  if (rows.length === 0) {
    return false;
  }

  const { error } = await supabase.from(table).upsert(rows, { onConflict });

  if (error) {
    if (optional && isSchemaOptionalError(error)) {
      console.log(`[skip] ${label}: ${error.message}`);
      return false;
    }

    throw error;
  }

  console.log(`[seed] ${label}: ${rows.length}`);
  return true;
}

async function applyPartialUpdates(options: {
  table: string;
  rows: Row[];
  key?: string;
  label?: string;
  optional?: boolean;
}) {
  const { table, rows, key = "id", label = table, optional = false } = options;
  if (rows.length === 0) {
    return false;
  }

  for (const row of rows) {
    const target = row[key];
    if (target === undefined || target === null) {
      continue;
    }

    const patch = { ...row };
    delete patch[key];

    const { error } = await supabase.from(table).update(patch).eq(key, target);
    if (error) {
      if (optional && isSchemaOptionalError(error)) {
        console.log(`[skip] ${label}: ${error.message}`);
        return false;
      }

      throw error;
    }
  }

  console.log(`[seed] ${label}: ${rows.length}`);
  return true;
}

async function fetchIdMap(options: {
  table: string;
  key: string;
  values: string[];
  label?: string;
  optional?: boolean;
}) {
  const { table, key, values, label = table, optional = false } = options;
  if (values.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase.from(table).select(`id, ${key}`).in(key, values);

  if (error) {
    if (optional && isSchemaOptionalError(error)) {
      console.log(`[skip] ${label}: ${error.message}`);
      return new Map<string, string>();
    }

    throw error;
  }

  const rows = (data ?? []) as unknown as Row[];
  return new Map(rows.map((item) => [String(item[key]), String(item.id)]));
}

async function replaceScopedRows(options: {
  table: string;
  scopeKey: string;
  scopeValue: string;
  rows: Row[];
  label?: string;
  optional?: boolean;
}) {
  const { table, scopeKey, scopeValue, rows, label = table, optional = false } = options;

  const { error: deleteError } = await supabase.from(table).delete().eq(scopeKey, scopeValue);
  if (deleteError) {
    if (optional && isSchemaOptionalError(deleteError)) {
      console.log(`[skip] ${label}: ${deleteError.message}`);
      return false;
    }

    throw deleteError;
  }

  if (rows.length === 0) {
    return true;
  }

  const { error: insertError } = await supabase.from(table).insert(rows);
  if (insertError) {
    if (optional && isSchemaOptionalError(insertError)) {
      console.log(`[skip] ${label}: ${insertError.message}`);
      return false;
    }

    throw insertError;
  }

  console.log(`[seed] ${label}: ${rows.length}`);
  return true;
}

async function upsertCompanyInfo(row: Row) {
  const { data, error } = await supabase.from("company_info").select("id").limit(1);
  if (error) {
    if (isSchemaOptionalError(error)) {
      console.log(`[skip] company_info: ${error.message}`);
      return false;
    }

    throw error;
  }

  const existingId = data?.[0]?.id ? String(data[0].id) : null;

  if (existingId) {
    const patch = { ...row };
    delete patch.id;

    const { error: updateError } = await supabase
      .from("company_info")
      .update(patch)
      .eq("id", existingId);

    if (updateError) {
      if (isSchemaOptionalError(updateError)) {
        console.log(`[skip] company_info: ${updateError.message}`);
        return false;
      }

      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase.from("company_info").insert(row);

    if (insertError) {
      if (isSchemaOptionalError(insertError)) {
        console.log(`[skip] company_info: ${insertError.message}`);
        return false;
      }

      throw insertError;
    }
  }

  console.log("[seed] company_info: 1");
  return true;
}

function requireId(map: Map<string, string>, key: string, label: string) {
  const value = map.get(key);
  if (!value) {
    throw new Error(`Missing ${label} for key "${key}" after seeding.`);
  }

  return value;
}

const projectRows: Row[] = [
  {
    title: "Р’С…С–РґРЅС– РґСѓР±РѕРІС– РґРІРµСЂС– РґР»СЏ РїСЂРёРІР°С‚РЅРѕРіРѕ Р±СѓРґРёРЅРєСѓ",
    slug: "vkhidni-dubovi-dveri-kyiv",
    description:
      "Р†РЅРґРёРІС–РґСѓР°Р»СЊРЅРёР№ РєРѕРјРїР»РµРєС‚ РІС…С–РґРЅРёС… РґРІРµСЂРµР№ Р· РјР°СЃРёРІСѓ РґСѓР±Р°, РїСЂРёС…РѕРІР°РЅРёРј СѓС‚РµРїР»РµРЅРЅСЏРј С‚Р° РїСЂРµРјС–Р°Р»СЊРЅРѕСЋ С„СѓСЂРЅС–С‚СѓСЂРѕСЋ.",
    category: "doors",
    style: ["РєР»Р°СЃРёРєР°", "СЃСѓС‡Р°СЃРЅР° СЂС–Р·СЊР±Р°"],
    materials: ["РґСѓР±", "РјРµС‚Р°Р»", "РјР°С‚РѕРІРµ СЃРєР»Рѕ"],
    dimensions: "1100 x 2300 РјРј",
    location: "РљРёС—РІ",
    completed_at: "2025-11-17",
    duration_days: 24,
    status: "public",
    is_featured: true,
    cover_image: media.doorHero,
    images: [media.doorHero, media.doorDetail],
    created_at: now,
    updated_at: now,
  },
  {
    title: "РљСѓС…РЅСЏ Р· СЏСЃРµРЅСЏ РґР»СЏ РєРІР°СЂС‚РёСЂРё Сѓ Р›СЊРІРѕРІС–",
    slug: "kukhnia-z-yasenia-lviv",
    description:
      "РљСѓС…РѕРЅРЅРёР№ РєРѕРјРїР»РµРєС‚ Р· РЅР°С‚СѓСЂР°Р»СЊРЅРѕРіРѕ СЏСЃРµРЅСЏ, С„Р°СЂР±РѕРІР°РЅРёРјРё С„Р°СЃР°РґР°РјРё С‚Р° РІР±СѓРґРѕРІР°РЅРёРјРё СЃРёСЃС‚РµРјР°РјРё Р·Р±РµСЂС–РіР°РЅРЅСЏ.",
    category: "furniture",
    style: ["РјС–РЅС–РјР°Р»С–Р·Рј", "С‚РµРїР»РёР№ СЃСѓС‡Р°СЃРЅРёР№"],
    materials: ["СЏСЃРµРЅ", "РњР”Р¤", "СЃРєР»Рѕ"],
    dimensions: "3.8 Рј + РѕСЃС‚СЂС–РІ 1.9 Рј",
    location: "Р›СЊРІС–РІ",
    completed_at: "2025-09-03",
    duration_days: 31,
    status: "public",
    is_featured: true,
    cover_image: media.kitchenHero,
    images: [media.kitchenHero, media.kitchenDetail, media.wardrobeHero],
    created_at: now,
    updated_at: now,
  },
  {
    title: "РџР°РЅРѕСЂР°РјРЅС– РџР’РҐ-РІС–РєРЅР° РґР»СЏ С‚РµСЂР°СЃРё",
    slug: "panoramni-vikna-pvh-dnipro",
    description:
      "Р•РЅРµСЂРіРѕРµС„РµРєС‚РёРІРЅС– РІС–РєРѕРЅРЅС– Р±Р»РѕРєРё Р· РјРѕРЅС‚Р°Р¶РµРј, С‚РµРїР»РёРј СЃРєР»РѕРїР°РєРµС‚РѕРј С‚Р° Р°РєСѓСЂР°С‚РЅРѕСЋ РІРЅСѓС‚СЂС–С€РЅСЊРѕСЋ РѕР±СЂРѕР±РєРѕСЋ.",
    category: "windows",
    style: ["СЃСѓС‡Р°СЃРЅРёР№", "РјС–РЅС–РјР°Р»С–Р·Рј"],
    materials: ["РџР’РҐ", "СЃРєР»Рѕ", "РјРµС‚Р°Р»"],
    dimensions: "2400 x 2100 РјРј",
    location: "Р”РЅС–РїСЂРѕ",
    completed_at: "2025-07-21",
    duration_days: 12,
    status: "public",
    is_featured: true,
    cover_image: media.windowHero,
    images: [media.windowHero, media.windowDetail],
    created_at: now,
    updated_at: now,
  },
  {
    title: "РћС„С–СЃРЅС– РґРІРµСЂС– РїС–Рґ NDA",
    slug: "ofisni-dveri-nda",
    description:
      "РљРѕРјРїР»РµРєС‚ РјС–Р¶РєС–РјРЅР°С‚РЅРёС… РґРІРµСЂРµР№ РґР»СЏ РѕС„С–СЃРЅРѕРіРѕ РїСЂРѕСЃС‚РѕСЂСѓ Р· РѕР±РјРµР¶РµРЅРёРј РїСѓР±Р»С–С‡РЅРёРј РґРѕСЃС‚СѓРїРѕРј РґРѕ РґРµС‚Р°Р»РµР№ СЂРµР°Р»С–Р·Р°С†С–С—.",
    category: "doors",
    style: ["РјС–РЅС–РјР°Р»С–Р·Рј"],
    materials: ["РґСѓР±", "РјРµС‚Р°Р»"],
    dimensions: "1200 x 2400 РјРј",
    location: "РљРёС—РІ",
    completed_at: "2024-12-11",
    duration_days: 21,
    status: "nda",
    is_featured: false,
    cover_image: media.doorDetail,
    images: [media.doorDetail],
    created_at: now,
    updated_at: now,
  },
];

const projectPatchRows: Row[] = [
  {
    slug: "vkhidni-dubovi-dveri-kyiv",
    privacy_level: "public",
    sort_order: 1,
    seo_title: "Р’С…С–РґРЅС– РґСѓР±РѕРІС– РґРІРµСЂС– РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ РІ РљРёС”РІС–",
    seo_description:
      "РџРѕСЂС‚С„РѕР»С–Рѕ Р°РІС‚РѕСЂСЃСЊРєРёС… РІС…С–РґРЅРёС… РґРІРµСЂРµР№ Р· РјР°СЃРёРІСѓ РґСѓР±Р°: РјР°С‚РµСЂС–Р°Р»Рё, СЃС‚РёР»СЊ, С‚РµСЂРјС–РЅ РІРёСЂРѕР±РЅРёС†С‚РІР° С‚Р° С„С–РЅР°Р»СЊРЅРёР№ СЂРµР·СѓР»СЊС‚Р°С‚.",
    blurred_images: [],
    private_client_name: null,
    private_location: null,
    private_notes: null,
  },
  {
    slug: "kukhnia-z-yasenia-lviv",
    privacy_level: "public",
    sort_order: 2,
    seo_title: "РљСѓС…РЅСЏ Р· СЏСЃРµРЅСЏ РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ Сѓ Р›СЊРІРѕРІС–",
    seo_description:
      "РљРµР№СЃ РєСѓС…РЅС– Р· РЅР°С‚СѓСЂР°Р»СЊРЅРѕРіРѕ СЏСЃРµРЅСЏ Р· С–РЅРґРёРІС–РґСѓР°Р»СЊРЅРёРј РїСЂРѕС”РєС‚СѓРІР°РЅРЅСЏРј, РїС–РґР±РѕСЂРѕРј С„СѓСЂРЅС–С‚СѓСЂРё С‚Р° РјРѕРЅС‚Р°Р¶РµРј.",
    blurred_images: [],
    private_client_name: null,
    private_location: null,
    private_notes: null,
  },
  {
    slug: "panoramni-vikna-pvh-dnipro",
    privacy_level: "public",
    sort_order: 3,
    seo_title: "РџР°РЅРѕСЂР°РјРЅС– РџР’РҐ-РІС–РєРЅР° Р· РјРѕРЅС‚Р°Р¶РµРј Сѓ Р”РЅС–РїСЂС–",
    seo_description:
      "РџСЂРёРєР»Р°Рґ СЂРµР°Р»С–Р·Р°С†С–С— РїР°РЅРѕСЂР°РјРЅРёС… РџР’РҐ-РІС–РєРѕРЅ Р· РµРЅРµСЂРіРѕРµС„РµРєС‚РёРІРЅРёРј СЃРєР»РѕРїР°РєРµС‚РѕРј С– РјРѕРЅС‚Р°Р¶РµРј РїС–Рґ РєР»СЋС‡.",
    blurred_images: [],
    private_client_name: null,
    private_location: null,
    private_notes: null,
  },
  {
    slug: "ofisni-dveri-nda",
    privacy_level: "nda_partial",
    sort_order: 4,
    seo_title: "РћС„С–СЃРЅС– РґРІРµСЂС– РїС–Рґ NDA",
    seo_description:
      "Р—Р°РєСЂРёС‚РёР№ РєРѕСЂРїРѕСЂР°С‚РёРІРЅРёР№ РїСЂРѕС”РєС‚. Р§Р°СЃС‚РёРЅР° РґРµС‚Р°Р»РµР№ С‚Р° С„РѕС‚Рѕ РїСЂРёС…РѕРІР°РЅС– РІС–РґРїРѕРІС–РґРЅРѕ РґРѕ СѓРјРѕРІ РєРѕРЅС„С–РґРµРЅС†С–Р№РЅРѕСЃС‚С–.",
    blurred_images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=30",
    ],
    private_client_name: "РљРѕРЅС„С–РґРµРЅС†С–Р№РЅРёР№ РєР»С–С”РЅС‚",
    private_location: "РљРёС—РІ",
    private_notes: "РџСѓР±Р»С–С‡РЅС– С„РѕС‚Рѕ РѕР±РјРµР¶РµРЅС– СѓРјРѕРІР°РјРё NDA.",
  },
];

const serviceRows: Row[] = [
  {
    title: "РђРІС‚РѕСЂСЃСЊРєС– РґРІРµСЂС–",
    slug: "dveri-na-zamovlennia",
    short_description: "Р’С…С–РґРЅС– С‚Р° РјС–Р¶РєС–РјРЅР°С‚РЅС– РґРІРµСЂС– Р· РЅР°С‚СѓСЂР°Р»СЊРЅРѕРіРѕ РґРµСЂРµРІР° РїС–Рґ РІР°С€С– СЂРѕР·РјС–СЂРё.",
    description:
      "РџСЂРѕС”РєС‚СѓС”РјРѕ С– РІРёРіРѕС‚РѕРІР»СЏС”РјРѕ РґРІРµСЂС–, СЏРєС– РїСЂР°С†СЋСЋС‚СЊ СЏРє Р°СЂС…С–С‚РµРєС‚СѓСЂРЅРёР№ Р°РєС†РµРЅС‚: РјР°С‚РµСЂС–Р°Р», РєРѕРЅСЃС‚СЂСѓРєС†С–СЏ, РїРѕРєСЂРёС‚С‚СЏ С– С„СѓСЂРЅС–С‚СѓСЂР° РїС–РґР±РёСЂР°СЋС‚СЊСЃСЏ РїС–Рґ РєРѕРЅРєСЂРµС‚РЅРёР№ РїСЂРѕСЃС‚С–СЂ.",
    process_steps: [
      { step: 1, title: "Р‘СЂРёС„", description: "РћР±РіРѕРІРѕСЂСЋС”РјРѕ Р·Р°РґР°С‡Сѓ, СЃС‚РёР»СЊ С–РЅС‚РµСЂ'С”СЂСѓ С‚Р° Р±СЋРґР¶РµС‚." },
      { step: 2, title: "Р—Р°РјС–СЂРё", description: "Р¤С–РєСЃСѓС”РјРѕ РїСЂРѕСЂС–Р·, РІСѓР·Р»Рё РјРѕРЅС‚Р°Р¶Сѓ С‚Р° С‚РµС…РЅС–С‡РЅС– РѕР±РјРµР¶РµРЅРЅСЏ." },
      { step: 3, title: "Р’РёСЂРѕР±РЅРёС†С‚РІРѕ", description: "Р“РѕС‚СѓС”РјРѕ РєСЂРµСЃР»РµРЅРЅСЏ, РїРѕРіРѕРґР¶СѓС”РјРѕ Р·СЂР°Р·РєРё С‚Р° Р·Р°РїСѓСЃРєР°С”РјРѕ РІ С†РµС…." },
      { step: 4, title: "РњРѕРЅС‚Р°Р¶", description: "Р”РѕСЃС‚Р°РІР»СЏС”РјРѕ, РІСЃС‚Р°РЅРѕРІР»СЋС”РјРѕ Р№ Р·РґР°С”РјРѕ РіРѕС‚РѕРІРёР№ РІРёСЂС–Р±." },
    ],
    cover_image: media.doorHero,
    sort_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    title: "РњРµР±Р»С– РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ",
    slug: "mebli-na-zamovlennia",
    short_description: "РљСѓС…РЅС–, С€Р°С„Рё, РіР°СЂРґРµСЂРѕР±РЅС– Р№ РєРѕСЂРїСѓСЃРЅС– СЂС–С€РµРЅРЅСЏ РїС–Рґ РєРѕРЅРєСЂРµС‚РЅРёР№ СЃС†РµРЅР°СЂС–Р№ Р¶РёС‚С‚СЏ.",
    description:
      "РЎС‚РІРѕСЂСЋС”РјРѕ РјРµР±Р»С–, СЏРєС– РїСЂР°С†СЋСЋС‚СЊ РЅРµ Р»РёС€Рµ РІС–Р·СѓР°Р»СЊРЅРѕ, Р° Р№ С„СѓРЅРєС†С–РѕРЅР°Р»СЊРЅРѕ: РІС–Рґ РїР»Р°РЅСѓРІР°РЅРЅСЏ РЅР°РїРѕРІРЅРµРЅРЅСЏ РґРѕ РјРѕРЅС‚Р°Р¶Сѓ РЅР° РѕР±'С”РєС‚С–.",
    process_steps: [
      { step: 1, title: "РџР»Р°РЅСѓРІР°РЅРЅСЏ", description: "Р—Р±РёСЂР°С”РјРѕ СЂРµС„РµСЂРµРЅСЃРё С‚Р° РїРѕР±СѓС‚РѕРІС– СЃС†РµРЅР°СЂС–С— РєРѕСЂРёСЃС‚СѓРІР°РЅРЅСЏ." },
      { step: 2, title: "Р•СЃРєС–Р·Рё", description: "РџСЂРѕРїРѕРЅСѓС”РјРѕ РєРѕРЅС„С–РіСѓСЂР°С†С–СЋ, РјР°С‚РµСЂС–Р°Р»Рё С‚Р° С„СѓСЂРЅС–С‚СѓСЂСѓ." },
      { step: 3, title: "Р¦РµС…", description: "Р’РёРіРѕС‚РѕРІР»СЏС”РјРѕ РєРѕСЂРїСѓСЃРё, С„Р°СЃР°РґРё С‚Р° С‚РµСЃС‚СѓС”РјРѕ РІСѓР·Р»Рё." },
      { step: 4, title: "РњРѕРЅС‚Р°Р¶", description: "Р—Р±РёСЂР°С”РјРѕ РјРµР±Р»С– РЅР° РѕР±'С”РєС‚С– С‚Р° С„С–РЅР°Р»СЊРЅРѕ СЂРµРіСѓР»СЋС”РјРѕ С„Р°СЃР°РґРё." },
    ],
    cover_image: media.kitchenHero,
    sort_order: 2,
    created_at: now,
    updated_at: now,
  },
  {
    title: "Р’С–РєРЅР° РџР’РҐ",
    slug: "vikna-pvh",
    short_description: "РўРµРїР»С– РџР’РҐ-РІС–РєРЅР° Р· РїС–РґР±РѕСЂРѕРј РїСЂРѕС„С–Р»СЋ, РІРёРіРѕС‚РѕРІР»РµРЅРЅСЏРј С– РјРѕРЅС‚Р°Р¶РµРј.",
    description:
      "Р”РѕРїРѕРјР°РіР°С”РјРѕ РїС–РґС–Р±СЂР°С‚Рё РєРѕРЅС„С–РіСѓСЂР°С†С–СЋ РІС–РєРЅР° РїС–Рґ С€СѓРј, РєР»С–РјР°С‚, РјРѕРЅС‚Р°Р¶РЅРёР№ РІСѓР·РѕР» С‚Р° Р°СЂС…С–С‚РµРєС‚СѓСЂСѓ С„Р°СЃР°РґСѓ.",
    process_steps: [
      { step: 1, title: "РћРіР»СЏРґ", description: "РћС†С–РЅСЋС”РјРѕ РїСЂРѕСЂС–Р·Рё, РІС–РґРєСЂРёРІР°РЅРЅСЏ С‚Р° СѓРјРѕРІРё РјРѕРЅС‚Р°Р¶Сѓ." },
      { step: 2, title: "РљРѕРјРїР»РµРєС‚Р°С†С–СЏ", description: "РџС–РґР±РёСЂР°С”РјРѕ РїСЂРѕС„С–Р»СЊ, СЃРєР»РѕРїР°РєРµС‚ С– С„СѓСЂРЅС–С‚СѓСЂСѓ." },
      { step: 3, title: "Р’РёРіРѕС‚РѕРІР»РµРЅРЅСЏ", description: "Р—Р°РїСѓСЃРєР°С”РјРѕ Р·Р°РјРѕРІР»РµРЅРЅСЏ С‚Р° РєРѕРЅС‚СЂРѕР»СЋС”РјРѕ С‚РµСЂРјС–РЅРё." },
      { step: 4, title: "РњРѕРЅС‚Р°Р¶", description: "РњРѕРЅС‚СѓС”РјРѕ, РіРµСЂРјРµС‚РёР·СѓС”РјРѕ Р№ РїРµСЂРµРІС–СЂСЏС”РјРѕ СЂРѕР±РѕС‚Сѓ СЃС‚СѓР»РѕРє." },
    ],
    cover_image: media.windowHero,
    sort_order: 3,
    created_at: now,
    updated_at: now,
  },
  {
    title: "Р РµСЃС‚Р°РІСЂР°С†С–СЏ РІРёСЂРѕР±С–РІ",
    slug: "restavratsiia-derevianykh-vyrobiv",
    short_description: "Р”РµР»С–РєР°С‚РЅРµ РІС–РґРЅРѕРІР»РµРЅРЅСЏ РґРІРµСЂРµР№, СЂР°Рј, РјРµР±Р»С–РІ С‚Р° РґРµРєРѕСЂР°С‚РёРІРЅРёС… РµР»РµРјРµРЅС‚С–РІ.",
    description:
      "РџСЂР°С†СЋС”РјРѕ Р· С†С–РЅРЅРёРјРё Р°Р±Рѕ РµРјРѕС†С–Р№РЅРѕ РІР°Р¶Р»РёРІРёРјРё СЂРµС‡Р°РјРё: РІС–Рґ РєРѕРЅСЃРµСЂРІР°С†С–С— С‚Р° РѕС‡РёС‰РµРЅРЅСЏ РґРѕ РїРѕРІРЅРѕРіРѕ РІС–РґРЅРѕРІР»РµРЅРЅСЏ РїРѕРєСЂРёС‚С‚СЏ.",
    process_steps: [
      { step: 1, title: "Р”С–Р°РіРЅРѕСЃС‚РёРєР°", description: "Р¤С–РєСЃСѓС”РјРѕ СЃС‚Р°РЅ РґРµСЂРµРІРёРЅРё, РїРѕРєСЂРёС‚С‚СЏ С‚Р° РІС‚СЂР°С‚Рё." },
      { step: 2, title: "РџСЂРѕР±Рё", description: "РџС–РґР±РёСЂР°С”РјРѕ РјРµС‚РѕРґ РѕС‡РёС‰РµРЅРЅСЏ С‚Р° РєРѕР»С–СЂ РјР°Р№Р±СѓС‚РЅСЊРѕРіРѕ С„С–РЅС–С€Сѓ." },
      { step: 3, title: "Р’С–РґРЅРѕРІР»РµРЅРЅСЏ", description: "Р РµРјРѕРЅС‚СѓС”РјРѕ РѕСЃРЅРѕРІСѓ, С€РїРѕРЅСѓС”РјРѕ Р№ РІС–РґРЅРѕРІР»СЋС”РјРѕ РґРµС‚Р°Р»С–." },
      { step: 4, title: "Р¤С–РЅС–С€", description: "РќР°РЅРѕСЃРёРјРѕ Р·Р°С…РёСЃС‚ С– РїРµСЂРµРґР°С”РјРѕ РІРёСЂС–Р± Р·Р°РјРѕРІРЅРёРєСѓ." },
    ],
    cover_image: media.restorationHero,
    sort_order: 4,
    created_at: now,
    updated_at: now,
  },
];

const servicePatchRows: Row[] = [
  {
    slug: "dveri-na-zamovlennia",
    tagline: "Р”РІРµСЂС–, С‰Рѕ РіРѕРІРѕСЂСЏС‚СЊ РїСЂРѕ РІР°СЃ",
    icon: "рџљЄ",
    gallery: [media.doorHero, media.doorDetail],
    category: "production",
    features: [
      { title: "Р†РЅРґРёРІС–РґСѓР°Р»СЊРЅС– СЂРѕР·РјС–СЂРё", description: "Р’С–Рґ РЅРµСЃС‚Р°РЅРґР°СЂС‚РЅРёС… РїСЂРѕСЂС–Р·С–РІ РґРѕ РїСЂРёС…РѕРІР°РЅРёС… РєРѕСЂРѕР±С–РІ." },
      { title: "РњР°С‚РµСЂС–Р°Р»Рё РїСЂРµРјС–СѓРјРєР»Р°СЃСѓ", description: "Р”СѓР±, СЏСЃРµРЅ, РњР”Р¤, СЃРєР»Рѕ С‚Р° РјРµС‚Р°Р»РµРІС– РїС–РґСЃРёР»РµРЅРЅСЏ." },
      { title: "РњРѕРЅС‚Р°Р¶ РїС–Рґ РєР»СЋС‡", description: "РљРѕРЅС‚СЂРѕР»СЊ РіРµРѕРјРµС‚СЂС–С—, СЂРµРіСѓР»СЋРІР°РЅРЅСЏ С‚Р° С„С–РЅС–С€РЅРµ РїСЂРёР№РјР°РЅРЅСЏ." },
    ],
    price_from: 28000,
    price_unit: "РіСЂРЅ",
    duration_days_from: 18,
    duration_days_to: 35,
    is_active: true,
    is_featured: true,
    seo_title: "РђРІС‚РѕСЂСЃСЊРєС– РґРІРµСЂС– РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ",
    seo_description: "Р’РёРіРѕС‚РѕРІР»РµРЅРЅСЏ РІС…С–РґРЅРёС… С‚Р° РјС–Р¶РєС–РјРЅР°С‚РЅРёС… РґРІРµСЂРµР№ РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ Р· РЅР°С‚СѓСЂР°Р»СЊРЅРѕРіРѕ РґРµСЂРµРІР°.",
  },
  {
    slug: "mebli-na-zamovlennia",
    tagline: "РЎРёСЃС‚РµРјР° Р·Р±РµСЂС–РіР°РЅРЅСЏ, СЏРєР° РїСЂР°С†СЋС” РЅР° С‰РѕРґРµРЅСЊ",
    icon: "рџЄ‘",
    gallery: [media.kitchenHero, media.kitchenDetail, media.wardrobeHero],
    category: "production",
    features: [
      { title: "РџС–Рґ РІР°С€ СЃС†РµРЅР°СЂС–Р№ Р¶РёС‚С‚СЏ", description: "Р•СЂРіРѕРЅРѕРјС–РєР°, Р»РѕРіС–РєР° Р·Р±РµСЂС–РіР°РЅРЅСЏ С‚Р° РґРѕСЃС‚СѓРї РґРѕ РєРѕР¶РЅРѕС— Р·РѕРЅРё." },
      { title: "Р“РЅСѓС‡РєР° РєРѕРјРїР»РµРєС‚Р°С†С–СЏ", description: "Р¤СѓСЂРЅС–С‚СѓСЂР°, РїС–РґСЃРІС–С‚РєР°, С„Р°СЂР±СѓРІР°РЅРЅСЏ, С€РїРѕРЅ С– СЃРёСЃС‚РµРјРё РІС–РґРєСЂРёРІР°РЅРЅСЏ." },
      { title: "РђРєСѓСЂР°С‚РЅРёР№ РјРѕРЅС‚Р°Р¶", description: "Р”РѕСЃС‚Р°РІРєР°, Р·Р±С–СЂРєР°, СЂРµРіСѓР»СЋРІР°РЅРЅСЏ С‚Р° С„С–РЅР°Р»СЊРЅР° РїРµСЂРµРІС–СЂРєР°." },
    ],
    price_from: 42000,
    price_unit: "РіСЂРЅ",
    duration_days_from: 20,
    duration_days_to: 45,
    is_active: true,
    is_featured: true,
    seo_title: "РњРµР±Р»С– РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ РґР»СЏ РєСѓС…РЅС–, С€Р°С„ С‚Р° РіР°СЂРґРµСЂРѕР±РЅРёС…",
    seo_description: "Р†РЅРґРёРІС–РґСѓР°Р»СЊРЅС– РјРµР±Р»С– РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ Р· РґРµСЂРµРІР° С‚Р° РњР”Р¤ Р· РїСЂРѕС”РєС‚СѓРІР°РЅРЅСЏРј С– РјРѕРЅС‚Р°Р¶РµРј.",
  },
  {
    slug: "vikna-pvh",
    tagline: "РўРµРїР»Рѕ, С‚РёС€Р° С– С‚РѕС‡РЅРёР№ РјРѕРЅС‚Р°Р¶",
    icon: "рџЄџ",
    gallery: [media.windowHero, media.windowDetail],
    category: "installation",
    features: [
      { title: "РџС–РґР±С–СЂ РїС–Рґ РѕР±'С”РєС‚", description: "Р С–С€РµРЅРЅСЏ РґР»СЏ РєРІР°СЂС‚РёСЂРё, Р±СѓРґРёРЅРєСѓ, РѕС„С–СЃСѓ С‚Р° РІРµР»РёРєРёС… РїСЂРѕСЂС–Р·С–РІ." },
      { title: "Р•РЅРµСЂРіРѕРµС„РµРєС‚РёРІРЅС–СЃС‚СЊ", description: "РћРїС‚РёРјР°Р»СЊРЅС– СЃРєР»РѕРїР°РєРµС‚Рё РґР»СЏ С‚РµРїР»Р°, С€СѓРјСѓ С‚Р° С–РЅСЃРѕР»СЏС†С–С—." },
      { title: "РЎРµСЂРІС–СЃ РїС–СЃР»СЏ РјРѕРЅС‚Р°Р¶Сѓ", description: "Р РµРіСѓР»СЋРІР°РЅРЅСЏ С‚Р° РєРѕРЅСЃСѓР»СЊС‚Р°С†С–СЏ Р· РґРѕРіР»СЏРґСѓ РїС–СЃР»СЏ РІСЃС‚Р°РЅРѕРІР»РµРЅРЅСЏ." },
    ],
    price_from: 16000,
    price_unit: "РіСЂРЅ",
    duration_days_from: 7,
    duration_days_to: 16,
    is_active: true,
    is_featured: false,
    seo_title: "РџР’РҐ-РІС–РєРЅР° Р· РІРёРіРѕС‚РѕРІР»РµРЅРЅСЏРј С– РјРѕРЅС‚Р°Р¶РµРј",
    seo_description: "РџС–РґР±С–СЂ, СЂРѕР·СЂР°С…СѓРЅРѕРє, РІРёРіРѕС‚РѕРІР»РµРЅРЅСЏ С‚Р° РјРѕРЅС‚Р°Р¶ РџР’РҐ-РІС–РєРѕРЅ РїС–Рґ РєР»СЋС‡.",
  },
  {
    slug: "restavratsiia-derevianykh-vyrobiv",
    tagline: "Р—Р±РµСЂС–РіР°С”РјРѕ С‚Рµ, С‰Рѕ РјР°С” С–СЃС‚РѕСЂС–СЋ",
    icon: "рџ› пёЏ",
    gallery: [media.restorationHero, media.workshop],
    category: "restoration",
    features: [
      { title: "Р”РµР»С–РєР°С‚РЅРёР№ РїС–РґС…С–Рґ", description: "РџСЂР°С†СЋС”РјРѕ Р· С†С–РЅРЅРёРјРё С‚Р° Р°РЅС‚РёРєРІР°СЂРЅРёРјРё РІРёСЂРѕР±Р°РјРё Р±РµР· РїРѕСЃРїС–С…Сѓ." },
      { title: "РџСЂРѕР±Рё РґРѕ СЃС‚Р°СЂС‚Сѓ", description: "РџРѕРіРѕРґР¶СѓС”РјРѕ С‚РµРєСЃС‚СѓСЂСѓ, С‚РѕРЅ С– С„С–РЅС–С€ РґРѕ РїРѕС‡Р°С‚РєСѓ РѕСЃРЅРѕРІРЅРёС… СЂРѕР±С–С‚." },
      { title: "РџРѕРІРЅРёР№ С†РёРєР»", description: "Р’С–Рґ РєРѕРЅСЃРµСЂРІР°С†С–С— РґРѕ С„С–РЅС–С€РЅРѕРіРѕ РїРѕРєСЂРёС‚С‚СЏ С‚Р° РјРѕРЅС‚Р°Р¶Сѓ РЅР°Р·Р°Рґ." },
    ],
    price_from: 12000,
    price_unit: "РіСЂРЅ",
    duration_days_from: 10,
    duration_days_to: 28,
    is_active: true,
    is_featured: false,
    seo_title: "Р РµСЃС‚Р°РІСЂР°С†С–СЏ РґРµСЂРµРІ'СЏРЅРёС… РґРІРµСЂРµР№, РјРµР±Р»С–РІ С‚Р° СЂР°Рј",
    seo_description: "РџСЂРѕС„РµСЃС–Р№РЅР° СЂРµСЃС‚Р°РІСЂР°С†С–СЏ РІРёСЂРѕР±С–РІ Р· РґРµСЂРµРІР° Р· РІС–РґРЅРѕРІР»РµРЅРЅСЏРј РєРѕРЅСЃС‚СЂСѓРєС†С–С— С‚Р° РїРѕРєСЂРёС‚С‚СЏ.",
  },
];

const pricePresetRows: Row[] = [
  { name: "Р”СѓР± (РґРѕС€РєР°)", variable_key: "oak_board", category: "material", unit: "Рј2", value: 1200, currency: "UAH", notes: "Р¦С–РЅР° Р·Р° Рј2 РґСѓР±РѕРІРѕС— РґРѕС€РєРё", created_at: now, updated_at: now },
  { name: "РЇСЃРµРЅ (РґРѕС€РєР°)", variable_key: "ash_board", category: "material", unit: "Рј2", value: 900, currency: "UAH", notes: "Р¦С–РЅР° Р·Р° Рј2 СЏСЃРµРЅРµРІРѕС— РґРѕС€РєРё", created_at: now, updated_at: now },
  { name: "РЎРѕСЃРЅР° (РґРѕС€РєР°)", variable_key: "pine_board", category: "material", unit: "Рј2", value: 450, currency: "UAH", notes: "Р¦С–РЅР° Р·Р° Рј2 СЃРѕСЃРЅРѕРІРѕС— РґРѕС€РєРё", created_at: now, updated_at: now },
  { name: "РњР”Р¤ 16 РјРј", variable_key: "mdf_16", category: "material", unit: "Рј2", value: 280, currency: "UAH", notes: "Р›РёСЃС‚ РњР”Р¤ 16 РјРј", created_at: now, updated_at: now },
  { name: "Р¤Р°РЅРµСЂР° 18 РјРј", variable_key: "plywood_18", category: "material", unit: "Рј2", value: 320, currency: "UAH", notes: "Р¤Р°РЅРµСЂР° 18 РјРј", created_at: now, updated_at: now },
  { name: "Р›Р°Рє РјР°С‚РѕРІРёР№", variable_key: "varnish_matte", category: "consumable", unit: "Рј2", value: 85, currency: "UAH", notes: "Р›Р°РєСѓРІР°РЅРЅСЏ Сѓ 2 С€Р°СЂРё", created_at: now, updated_at: now },
  { name: "Р¤Р°СЂР±Р° Р±С–Р»Р°", variable_key: "paint_white", category: "consumable", unit: "Рј2", value: 120, currency: "UAH", notes: "РђРєСЂРёР»РѕРІР° С„Р°СЂР±Р°", created_at: now, updated_at: now },
  { name: "Р¤СѓСЂРЅС–С‚СѓСЂР° СЃС‚Р°РЅРґР°СЂС‚", variable_key: "hardware_std", category: "material", unit: "РєРѕРјРїР»РµРєС‚", value: 1800, currency: "UAH", notes: "РџРµС‚Р»С–, СЂСѓС‡РєР°, Р·Р°РјРѕРє", created_at: now, updated_at: now },
  { name: "Р¤СѓСЂРЅС–С‚СѓСЂР° РїСЂРµРјС–СѓРј", variable_key: "hardware_premium", category: "material", unit: "РєРѕРјРїР»РµРєС‚", value: 4500, currency: "UAH", notes: "РџСЂРµРјС–Р°Р»СЊРЅРёР№ РєРѕРјРїР»РµРєС‚ С„СѓСЂРЅС–С‚СѓСЂРё", created_at: now, updated_at: now },
  { name: "РЎРєР»Рѕ РјР°С‚РѕРІРµ 4 РјРј", variable_key: "glass_frosted", category: "material", unit: "Рј2", value: 650, currency: "UAH", notes: "РњР°С‚РѕРІe СЃРєР»Рѕ 4 РјРј", created_at: now, updated_at: now },
  { name: "РњРѕРЅС‚Р°Р¶ РґРІРµСЂРµР№", variable_key: "install_door", category: "labor", unit: "С€С‚", value: 1500, currency: "UAH", notes: "Р’СЃС‚Р°РЅРѕРІР»РµРЅРЅСЏ РѕРґРЅРѕРіРѕ РґРІРµСЂРЅРѕРіРѕ Р±Р»РѕРєСѓ", created_at: now, updated_at: now },
  { name: "РњРѕРЅС‚Р°Р¶ РІС–РєРЅР°", variable_key: "install_window", category: "labor", unit: "С€С‚", value: 2200, currency: "UAH", notes: "Р’СЃС‚Р°РЅРѕРІР»РµРЅРЅСЏ РѕРґРЅРѕРіРѕ РІС–РєРЅР°", created_at: now, updated_at: now },
  { name: "РЎС‚РѕР»СЏСЂ РіРѕРґРёРЅР°", variable_key: "carpenter_hour", category: "labor", unit: "РіРѕРґ", value: 250, currency: "UAH", notes: "РџРѕРіРѕРґРёРЅРЅР° СЃС‚Р°РІРєР° РјР°Р№СЃС‚СЂР°", created_at: now, updated_at: now },
  { name: "Р¦РµС… Р·Р° РґРµРЅСЊ", variable_key: "workshop_day", category: "overhead", unit: "РґРµРЅСЊ", value: 800, currency: "UAH", notes: "РђРјРѕСЂС‚РёР·Р°С†С–СЏ С†РµС…Сѓ Р·Р° РґРµРЅСЊ", created_at: now, updated_at: now },
  { name: "Р”РѕСЃС‚Р°РІРєР° Р·Р° РєРј", variable_key: "delivery_km", category: "overhead", unit: "РєРј", value: 15, currency: "UAH", notes: "Р›РѕРіС–СЃС‚РёРєР° Р·Р° РєС–Р»РѕРјРµС‚СЂ", created_at: now, updated_at: now },
];

const formulaInputDoor = [
  { key: "width_m", label: "РЁРёСЂРёРЅР°", unit: "Рј", type: "number", default_value: 0.9, min: 0.5, max: 1.5 },
  { key: "height_m", label: "Р’РёСЃРѕС‚Р°", unit: "Рј", type: "number", default_value: 2.1, min: 1.8, max: 2.8 },
  { key: "quantity", label: "РљС–Р»СЊРєС–СЃС‚СЊ", unit: "С€С‚", type: "number", default_value: 1, min: 1, max: 20 },
  { key: "has_glass", label: "Р„ СЃРєР»Рѕ", unit: "bool", type: "boolean", default_value: 0 },
];

const formulaInputFurniture = [
  { key: "area_m2", label: "РџР»РѕС‰Р° С„Р°СЃР°РґС–РІ", unit: "Рј2", type: "number", default_value: 6, min: 1, max: 50 },
  { key: "quantity", label: "РљС–Р»СЊРєС–СЃС‚СЊ РјРѕРґСѓР»С–РІ", unit: "С€С‚", type: "number", default_value: 6, min: 1, max: 50 },
  { key: "has_paint", label: "РџРѕС‚СЂС–Р±РЅРµ С„Р°СЂР±СѓРІР°РЅРЅСЏ", unit: "bool", type: "boolean", default_value: 1 },
];

const formulaInputWindow = [
  { key: "width_m", label: "РЁРёСЂРёРЅР°", unit: "Рј", type: "number", default_value: 1.6, min: 0.5, max: 4 },
  { key: "height_m", label: "Р’РёСЃРѕС‚Р°", unit: "Рј", type: "number", default_value: 1.4, min: 0.5, max: 3 },
  { key: "quantity", label: "РљС–Р»СЊРєС–СЃС‚СЊ", unit: "С€С‚", type: "number", default_value: 1, min: 1, max: 20 },
  { key: "floors", label: "РџРѕРІРµСЂС…", unit: "РїРѕРІ.", type: "number", default_value: 1, min: 1, max: 25 },
];

const priceFormulaRows: Row[] = [
  {
    name: "door_entry_oak_v1",
    product_type: "door",
    description: "Р‘Р°Р·РѕРІР° С„РѕСЂРјСѓР»Р° РґР»СЏ РІС…С–РґРЅРёС… РґСѓР±РѕРІРёС… РґРІРµСЂРµР№ Р· РѕРїС†С–РѕРЅР°Р»СЊРЅРёРј СЃРєР»С–РЅРЅСЏРј.",
    input_schema: formulaInputDoor,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    name: "kitchen_furniture_ash_v1",
    product_type: "furniture",
    description: "Р¤РѕСЂРјСѓР»Р° РґР»СЏ РєСѓС…РѕРЅСЊ С‚Р° РєРѕСЂРїСѓСЃРЅРёС… РјРµР±Р»С–РІ РЅР° Р±Р°Р·С– СЏСЃРµРЅСЏ Р№ РњР”Р¤.",
    input_schema: formulaInputFurniture,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    name: "window_pvc_install_v1",
    product_type: "window",
    description: "Р¤РѕСЂРјСѓР»Р° СЂРѕР·СЂР°С…СѓРЅРєСѓ РџР’РҐ-РІС–РєРѕРЅ Р· РјРѕРЅС‚Р°Р¶РµРј С‚Р° Р»РѕРіС–СЃС‚РёРєРѕСЋ.",
    input_schema: formulaInputWindow,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
];

const priceFormulaPatchRows: Row[] = [
  { name: "door_entry_oak_v1", user_inputs: formulaInputDoor },
  { name: "kitchen_furniture_ash_v1", user_inputs: formulaInputFurniture },
  { name: "window_pvc_install_v1", user_inputs: formulaInputWindow },
];

const productRows: Row[] = [
  {
    title: "Р’С…С–РґРЅС– РґРІРµСЂС– Р· РјР°СЃРёРІСѓ РґСѓР±Р° Premium",
    slug: "vkhidni-dveri-z-duba-premium",
    description:
      "РњР°СЃРёРІРЅС– РІС…С–РґРЅС– РґРІРµСЂС– Р· РґСѓР±Р° Р· СѓС‚РµРїР»РµРЅРЅСЏРј, РјРµС‚Р°Р»РµРІРёРј РїС–РґСЃРёР»РµРЅРЅСЏРј С‚Р° РѕРїС†С–С”СЋ РґРµРєРѕСЂР°С‚РёРІРЅРѕРіРѕ СЃРєР»С–РЅРЅСЏ.",
    short_description: "Р”СѓР±, РїСЂРµРјС–Р°Р»СЊРЅР° С„СѓСЂРЅС–С‚СѓСЂР°, С–РЅРґРёРІС–РґСѓР°Р»СЊРЅС– СЂРѕР·РјС–СЂРё С‚Р° РєС–Р»СЊРєР° СЃС†РµРЅР°СЂС–С—РІ РѕР·РґРѕР±Р»РµРЅРЅСЏ.",
    category: "doors",
    materials: ["РґСѓР±", "РјРµС‚Р°Р»", "СЃРєР»Рѕ"],
    style: ["СЃСѓС‡Р°СЃРЅР° РєР»Р°СЃРёРєР°"],
    cover_image: media.doorHero,
    images: [media.doorHero, media.doorDetail],
    price_from: 28000,
    status: "active",
    sort_order: 1,
    is_featured: true,
    seo_title: "Р’С…С–РґРЅС– РґСѓР±РѕРІС– РґРІРµСЂС– Premium",
    seo_description: "РђРІС‚РѕСЂСЃСЊРєС– РІС…С–РґРЅС– РґРІРµСЂС– Р· РјР°СЃРёРІСѓ РґСѓР±Р° Р· С–РЅРґРёРІС–РґСѓР°Р»СЊРЅРѕСЋ РєРѕРјРїР»РµРєС‚Р°С†С–С”СЋ С‚Р° РјРѕРЅС‚Р°Р¶РµРј.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "РљСѓС…РЅСЏ Р· СЏСЃРµРЅСЏ Linea",
    slug: "kukhnia-z-yasenia-linea",
    description:
      "РљСѓС…РЅСЏ РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ Р· РЅР°С‚СѓСЂР°Р»СЊРЅРѕРіРѕ СЏСЃРµРЅСЏ, С„Р°СЂР±РѕРІР°РЅРёРјРё С„Р°СЃР°РґР°РјРё, С–РЅС‚РµРіСЂРѕРІР°РЅРёРјРё СЂСѓС‡РєР°РјРё С‚Р° РѕСЃС‚СЂРѕРІРѕРј.",
    short_description: "Р¤Р°СЃР°РґРё Р· СЏСЃРµРЅСЏ, РєРѕСЂРїСѓСЃРё Р· РњР”Р¤ С‚Р° С„СѓСЂРЅС–С‚СѓСЂР° РїС–Рґ С‰РѕРґРµРЅРЅРµ РЅР°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ.",
    category: "furniture",
    materials: ["СЏСЃРµРЅ", "РњР”Р¤"],
    style: ["РјС–РЅС–РјР°Р»С–Р·Рј", "С‚РµРїР»РёР№ СЃСѓС‡Р°СЃРЅРёР№"],
    cover_image: media.kitchenHero,
    images: [media.kitchenHero, media.kitchenDetail],
    price_from: 54000,
    status: "active",
    sort_order: 2,
    is_featured: true,
    seo_title: "РљСѓС…РЅСЏ Р· СЏСЃРµРЅСЏ РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ",
    seo_description: "Р†РЅРґРёРІС–РґСѓР°Р»СЊРЅР° РєСѓС…РЅСЏ Р· СЏСЃРµРЅСЏ Р· СЂРѕР·СЂР°С…СѓРЅРєРѕРј, РІРёСЂРѕР±РЅРёС†С‚РІРѕРј С– РјРѕРЅС‚Р°Р¶РµРј.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "РЁР°С„Р°-РіР°СЂРґРµСЂРѕР± Р· СЏСЃРµРЅСЏ Frame",
    slug: "shafa-harderob-yasen-frame",
    description:
      "Р’Р±СѓРґРѕРІР°РЅР° С€Р°С„Р°-РіР°СЂРґРµСЂРѕР± Р· СЏСЃРµРЅРµРІРёРјРё С„Р°СЃР°РґР°РјРё, РїСЂРѕРґСѓРјР°РЅРёРј Р·РѕРЅСѓРІР°РЅРЅСЏРј С– РїСЂРёС…РѕРІР°РЅРѕСЋ С„СѓСЂРЅС–С‚СѓСЂРѕСЋ.",
    short_description: "Р“Р°СЂРґРµСЂРѕР±РЅР° СЃРёСЃС‚РµРјР° Р· СЏСЃРµРЅСЏ РґР»СЏ СЃРїР°Р»СЊРЅС– Р°Р±Рѕ РїРµСЂРµРґРїРѕРєРѕСЋ.",
    category: "furniture",
    materials: ["СЏСЃРµРЅ", "РњР”Р¤", "СЃРєР»Рѕ"],
    style: ["РјС–РЅС–РјР°Р»С–Р·Рј"],
    cover_image: media.wardrobeHero,
    images: [media.wardrobeHero],
    price_from: 36000,
    status: "active",
    sort_order: 3,
    is_featured: false,
    seo_title: "РЁР°С„Р°-РіР°СЂРґРµСЂРѕР± Р· СЏСЃРµРЅСЏ",
    seo_description: "Р’Р±СѓРґРѕРІР°РЅР° С€Р°С„Р°-РіР°СЂРґРµСЂРѕР± Р· С–РЅРґРёРІС–РґСѓР°Р»СЊРЅРѕСЋ РєРѕРјРїР»РµРєС‚Р°С†С–С”СЋ.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "РџР’РҐ-РІС–РєРЅРѕ Komfort",
    slug: "vikno-pvh-komfort",
    description:
      "РџР’РҐ-РІС–РєРЅРѕ Р· РµРЅРµСЂРіРѕРµС„РµРєС‚РёРІРЅРёРј СЃРєР»РѕРїР°РєРµС‚РѕРј, СЏРєС–СЃРЅРѕСЋ С„СѓСЂРЅС–С‚СѓСЂРѕСЋ С‚Р° РїСЂРѕС„РµСЃС–Р№РЅРёРј РјРѕРЅС‚Р°Р¶РµРј.",
    short_description: "РќР°РґС–Р№РЅР° РєРѕРЅС„С–РіСѓСЂР°С†С–СЏ РґР»СЏ РєРІР°СЂС‚РёСЂ С– Р±СѓРґРёРЅРєС–РІ Р· РјРѕРЅС‚Р°Р¶РµРј РїС–Рґ РєР»СЋС‡.",
    category: "windows",
    materials: ["РџР’РҐ", "СЃРєР»Рѕ", "РјРµС‚Р°Р»"],
    style: ["СЃСѓС‡Р°СЃРЅРёР№"],
    cover_image: media.windowHero,
    images: [media.windowHero, media.windowDetail],
    price_from: 16000,
    status: "active",
    sort_order: 4,
    is_featured: true,
    seo_title: "РџР’РҐ-РІС–РєРЅРѕ Komfort",
    seo_description: "РџР’РҐ-РІС–РєРЅРѕ Р· РїС–РґР±РѕСЂРѕРј РїСЂРѕС„С–Р»СЋ, РІРёРіРѕС‚РѕРІР»РµРЅРЅСЏРј С‚Р° РјРѕРЅС‚Р°Р¶РµРј.",
    created_at: now,
    updated_at: now,
  },
];

const siteSettingsRows: Row[] = [
  {
    key: "contacts",
    value: {
      phone: "+380 (67) 000-00-00",
      email: "info@svitlytsya.ua",
      address: "РІСѓР». РЎРѕРЅСЏС‡РЅР°, 22, РљРёС—РІ, РЈРєСЂР°С—РЅР°",
      hours: "РџРЅ-РџС‚: 09:00-18:00",
    },
    description: "РљРѕРЅС‚Р°РєС‚Рё",
    created_at: now,
    updated_at: now,
  },
  {
    key: "seo_home",
    value: {
      title: "РЎРІС–С‚Р»РёС†СЏ РњР°Р№СЃС‚СЂР° вЂ” РґРІРµСЂС–, РјРµР±Р»С– С‚Р° РІС–РєРЅР° РЅР° Р·Р°РјРѕРІР»РµРЅРЅСЏ",
      description:
        "РЎС–РјРµР№РЅР° РјР°Р№СЃС‚РµСЂРЅСЏ, С‰Рѕ СЃС‚РІРѕСЂСЋС” Р°РІС‚РѕСЂСЃСЊРєС– РґРІРµСЂС–, РјРµР±Р»С– С‚Р° РІС–РєРЅР° Р· Р°РєС†РµРЅС‚РѕРј РЅР° РјР°С‚РµСЂС–Р°Р», С„СѓРЅРєС†С–СЋ С– РґРѕРІРіРѕРІС–С‡РЅС–СЃС‚СЊ.",
    },
    description: "SEO РіРѕР»РѕРІРЅРѕС—",
    created_at: now,
    updated_at: now,
  },
  {
    key: "ai_chat_system_prompt",
    value:
      "РўРё С†РёС„СЂРѕРІРёР№ РїРѕРјС–С‡РЅРёРє РјР°Р№СЃС‚РµСЂРЅС–. Р’С–РґРїРѕРІС–РґР°Р№ СѓРєСЂР°С—РЅСЃСЊРєРѕСЋ, РґРѕРїРѕРјР°РіР°Р№ РїС–РґС–Р±СЂР°С‚Рё РїРѕСЃР»СѓРіСѓ С‚Р° Р·Р±РёСЂР°Р№ РґР°РЅС– РґР»СЏ Р·Р°СЏРІРєРё Р±РµР· РІРёРіР°РґР°РЅРёС… РѕР±С–С†СЏРЅРѕРє.",
    description: "Prompt РґР»СЏ AI С‡Р°С‚Сѓ",
    created_at: now,
    updated_at: now,
  },
];

function testimonialRows(projectIds: Map<string, string>): Row[] {
  return [
    {
      id: fixedIds.testimonialDoor,
      author_name: "Олена К.",
      author_location: "Київ",
      content: "Двері вийшли саме такими, як ми хотіли: важкі, теплі й дуже акуратні в деталях.",
      rating: 5,
      project_id: projectIds.get("vkhidni-dubovi-dveri-kyiv") ?? null,
      is_visible: true,
      created_at: now,
    },
    {
      id: fixedIds.testimonialKitchen,
      author_name: "Сергій М.",
      author_location: "Львів",
      content: "Команда допомогла з ергономікою кухні, і тепер нею реально зручно користуватися щодня.",
      rating: 5,
      project_id: projectIds.get("kukhnia-z-yasenia-lviv") ?? null,
      is_visible: true,
      created_at: now,
    },
    {
      id: fixedIds.testimonialWindow,
      author_name: "Ірина П.",
      author_location: "Дніпро",
      content: "Після монтажу вікон стало значно тихіше, а оздоблення зробили дуже чисто.",
      rating: 4,
      project_id: projectIds.get("panoramni-vikna-pvh-dnipro") ?? null,
      is_visible: true,
      created_at: now,
    },
  ];
}

function inquiryRows(projectIds: Map<string, string>): Row[] {
  return [
    {
      id: fixedIds.inquiryDoor,
      name: "Р†РіРѕСЂ РЁРµРІС‡СѓРє",
      phone: "+380671112233",
      email: "igor@example.com",
      service_type: "Р”РІРµСЂС–",
      message: "РџРѕС‚СЂС–Р±РЅС– РІС…С–РґРЅС– РґСѓР±РѕРІС– РґРІРµСЂС– Р· С‚РµРїР»РёРј РїРѕСЂРѕРіРѕРј С‚Р° РјРѕР¶Р»РёРІС–СЃС‚СЋ РІСЃС‚Р°РІРєРё СЃРєР»Р°.",
      source_page: "/products/vkhidni-dveri-z-duba-premium",
      project_ref_id: projectIds.get("vkhidni-dubovi-dveri-kyiv") ?? null,
      status: "new",
      created_at: now,
    },
    {
      id: fixedIds.inquiryKitchen,
      name: "РђРЅРЅР° РљРѕРІР°Р»СЊ",
      phone: "+380671112244",
      email: "anna@example.com",
      service_type: "РњРµР±Р»С–",
      message: "Р¦С–РєР°РІРёС‚СЊ РєСѓС…РЅСЏ Р· СЏСЃРµРЅСЏ С‚Р° РѕРєСЂРµРјР° С€Р°С„Р° РІ СЃРїР°Р»СЊРЅСЋ.",
      source_page: "/services/mebli-na-zamovlennia",
      project_ref_id: projectIds.get("kukhnia-z-yasenia-lviv") ?? null,
      status: "quoted",
      created_at: now,
    },
    {
      id: fixedIds.inquiryWindow,
      name: "Р’С–РєС‚РѕСЂ РџР°Р»Р°РјР°СЂС‡СѓРє",
      phone: "+380671112255",
      email: "viktor@example.com",
      service_type: "Р’С–РєРЅР°",
      message: "РџРѕС‚СЂС–Р±РµРЅ СЂРѕР·СЂР°С…СѓРЅРѕРє РґРІРѕС… РџР’РҐ-РІС–РєРѕРЅ РґР»СЏ С‚РµСЂР°СЃРё Р· РјРѕРЅС‚Р°Р¶РµРј РЅР° 3 РїРѕРІРµСЂСЃС–.",
      source_page: "/services/vikna-pvh",
      project_ref_id: projectIds.get("panoramni-vikna-pvh-dnipro") ?? null,
      status: "contacted",
      created_at: now,
    },
  ];
}

async function main() {
  const pricingEnabled = await upsertRows({
    table: "price_presets",
    rows: pricePresetRows,
    onConflict: "variable_key",
    label: "price presets",
    optional: true,
  });

  let presetIds = new Map<string, string>();
  let formulaIds = new Map<string, string>();

  if (pricingEnabled) {
    presetIds = await fetchIdMap({
      table: "price_presets",
      key: "variable_key",
      values: pricePresetRows.map((row) => String(row.variable_key)),
      label: "price preset ids",
      optional: true,
    });

    const formulasSeeded = await upsertRows({
      table: "price_formulas",
      rows: priceFormulaRows,
      onConflict: "name",
      label: "price formulas",
      optional: true,
    });

    if (formulasSeeded) {
      await applyPartialUpdates({
        table: "price_formulas",
        rows: priceFormulaPatchRows,
        key: "name",
        label: "price formula user inputs",
        optional: true,
      });

      formulaIds = await fetchIdMap({
        table: "price_formulas",
        key: "name",
        values: priceFormulaRows.map((row) => String(row.name)),
        label: "price formula ids",
        optional: true,
      });

      const formulaComponents = [
        {
          formulaKey: "door_entry_oak_v1",
          rows: [
            {
              id: "72000000-0000-4000-8000-000000000001",
              type: "material",
              label: "Р”СѓР±РѕРІР° РѕСЃРЅРѕРІР°",
              presetKey: "oak_board",
              expression: "width_m * height_m * quantity * 1.15 * preset_value",
              condition: null,
              notes: "Р—Р°РїР°СЃ РЅР° РѕР±СЂС–Р·РєРё С‚Р° С‚РµС…РЅРѕР»РѕРіС–С‡РЅРёР№ РІС–РґС…С–Рґ.",
              is_discount: false,
              sort_order: 0,
            },
            {
              id: "72000000-0000-4000-8000-000000000002",
              type: "consumable",
              label: "Р›Р°РєСѓРІР°РЅРЅСЏ",
              presetKey: "varnish_matte",
              expression: "width_m * height_m * quantity * preset_value",
              condition: null,
              notes: "РњР°С‚РѕРІРёР№ Р»Р°Рє Сѓ РґРІР° С€Р°СЂРё.",
              is_discount: false,
              sort_order: 1,
            },
            {
              id: "72000000-0000-4000-8000-000000000003",
              type: "material",
              label: "РЎРєР»С–РЅРЅСЏ",
              presetKey: "glass_frosted",
              expression: "width_m * height_m * 0.22 * quantity * preset_value",
              condition: "has_glass == true",
              notes: "Р”РѕРґР°С”С‚СЊСЃСЏ Р»РёС€Рµ СЏРєС‰Рѕ РєР»С–С”РЅС‚ РѕР±СЂР°РІ СЃРєР»С–РЅРЅСЏ.",
              is_discount: false,
              sort_order: 2,
            },
            {
              id: "72000000-0000-4000-8000-000000000004",
              type: "material",
              label: "Р¤СѓСЂРЅС–С‚СѓСЂР°",
              presetKey: "hardware_premium",
              expression: "quantity * preset_value",
              condition: null,
              notes: "РџСЂРµРјС–Р°Р»СЊРЅРёР№ РєРѕРјРїР»РµРєС‚ СЂСѓС‡РєРё, Р·Р°РјРєР° С‚Р° РїРµС‚РµР»СЊ.",
              is_discount: false,
              sort_order: 3,
            },
            {
              id: "72000000-0000-4000-8000-000000000005",
              type: "labor",
              label: "РњРѕРЅС‚Р°Р¶",
              presetKey: "install_door",
              expression: "quantity * preset_value",
              condition: null,
              notes: "Р’СЃС‚Р°РЅРѕРІР»РµРЅРЅСЏ РѕРґРЅРѕРіРѕ РґРІРµСЂРЅРѕРіРѕ Р±Р»РѕРєСѓ.",
              is_discount: false,
              sort_order: 4,
            },
            {
              id: "72000000-0000-4000-8000-000000000006",
              type: "overhead",
              label: "Р¦РµС…РѕРІС– РІРёС‚СЂР°С‚Рё",
              presetKey: "workshop_day",
              expression: "quantity * 0.5 * preset_value",
              condition: null,
              notes: "Р‘Р°Р·РѕРІР° С‡Р°СЃС‚РєР° РІРёСЂРѕР±РЅРёС‡РёС… РЅР°РєР»Р°РґРЅРёС….",
              is_discount: false,
              sort_order: 5,
            },
          ],
        },
        {
          formulaKey: "kitchen_furniture_ash_v1",
          rows: [
            {
              id: "72000000-0000-4000-8000-000000000007",
              type: "material",
              label: "РЇСЃРµРЅРµРІС– С„Р°СЃР°РґРё",
              presetKey: "ash_board",
              expression: "area_m2 * 1.18 * preset_value",
              condition: null,
              notes: "Р¤Р°СЃР°РґРё С‚Р° РІРёРґРёРјС– РїР»РѕС‰РёРЅРё.",
              is_discount: false,
              sort_order: 0,
            },
            {
              id: "72000000-0000-4000-8000-000000000008",
              type: "material",
              label: "РљРѕСЂРїСѓСЃРё РњР”Р¤",
              presetKey: "mdf_16",
              expression: "area_m2 * 0.85 * preset_value",
              condition: null,
              notes: "РљРѕСЂРїСѓСЃРЅС– РµР»РµРјРµРЅС‚Рё РґР»СЏ Р±Р°Р·РѕРІРѕС— РєРѕРјРїР»РµРєС‚Р°С†С–С—.",
              is_discount: false,
              sort_order: 1,
            },
            {
              id: "72000000-0000-4000-8000-000000000009",
              type: "consumable",
              label: "Р¤Р°СЂР±СѓРІР°РЅРЅСЏ С„Р°СЃР°РґС–РІ",
              presetKey: "paint_white",
              expression: "area_m2 * preset_value",
              condition: "has_paint == true",
              notes: "Р”РѕРґР°С”С‚СЊСЃСЏ Р»РёС€Рµ РґР»СЏ С„Р°СЂР±РѕРІР°РЅРёС… С„Р°СЃР°РґС–РІ.",
              is_discount: false,
              sort_order: 2,
            },
            {
              id: "72000000-0000-4000-8000-000000000010",
              type: "material",
              label: "Р¤СѓСЂРЅС–С‚СѓСЂР°",
              presetKey: "hardware_std",
              expression: "quantity * preset_value",
              condition: null,
              notes: "РќР°РїСЂСЏРјРЅС–, Р·Р°РІС–СЃРё С‚Р° Р±Р°Р·РѕРІС– РјРµС…Р°РЅС–Р·РјРё.",
              is_discount: false,
              sort_order: 3,
            },
            {
              id: "72000000-0000-4000-8000-000000000011",
              type: "labor",
              label: "Р РѕР±РѕС‚Р° СЃС‚РѕР»СЏСЂР°",
              presetKey: "carpenter_hour",
              expression: "area_m2 * 3.5 * preset_value",
              condition: null,
              notes: "РћСЂС–С”РЅС‚РѕРІРЅР° С‚СЂСѓРґРѕРјС–СЃС‚РєС–СЃС‚СЊ РїРѕ С„Р°СЃР°РґР°С… С– СЃРєР»Р°РґР°РЅРЅСЋ.",
              is_discount: false,
              sort_order: 4,
            },
            {
              id: "72000000-0000-4000-8000-000000000012",
              type: "margin",
              label: "Р—РЅРёР¶РєР° РЅР° РєРѕРјРїР»РµРєС‚",
              presetKey: null,
              expression: "quantity >= 8 ? 2500 : 0",
              condition: "quantity >= 8",
              notes: "РќРµРІРµР»РёРєР° Р·РЅРёР¶РєР° РґР»СЏ РІРµР»РёРєРѕС— РєРѕРЅС„С–РіСѓСЂР°С†С–С—.",
              is_discount: true,
              sort_order: 5,
            },
          ],
        },
        {
          formulaKey: "window_pvc_install_v1",
          rows: [
            {
              id: "72000000-0000-4000-8000-000000000013",
              type: "material",
              label: "РЎРєР»РѕРїР°РєРµС‚",
              presetKey: "glass_frosted",
              expression: "width_m * height_m * quantity * 0.9 * preset_value",
              condition: null,
              notes: "РЈРјРѕРІРЅР° Р±Р°Р·Р° РґР»СЏ СЃРєР»РѕРїР°РєРµС‚Р°.",
              is_discount: false,
              sort_order: 0,
            },
            {
              id: "72000000-0000-4000-8000-000000000014",
              type: "labor",
              label: "РњРѕРЅС‚Р°Р¶",
              presetKey: "install_window",
              expression: "quantity * preset_value",
              condition: null,
              notes: "РњРѕРЅС‚Р°Р¶ РѕРґРЅРѕРіРѕ РІС–РєРѕРЅРЅРѕРіРѕ Р±Р»РѕРєСѓ.",
              is_discount: false,
              sort_order: 1,
            },
            {
              id: "72000000-0000-4000-8000-000000000015",
              type: "overhead",
              label: "Р›РѕРіС–СЃС‚РёРєР°",
              presetKey: "delivery_km",
              expression: "20 * preset_value",
              condition: null,
              notes: "РЈСЃРµСЂРµРґРЅРµРЅРёР№ РІРёС—Р·Рґ РїРѕ РјС–СЃС‚Сѓ С‚Р° РїРµСЂРµРґРјС–СЃС‚СЋ.",
              is_discount: false,
              sort_order: 2,
            },
            {
              id: "72000000-0000-4000-8000-000000000016",
              type: "overhead",
              label: "РџС–РґР№РѕРј РЅР° РїРѕРІРµСЂС…",
              presetKey: null,
              expression: "(floors - 2) * 250 * quantity",
              condition: "floors > 2",
              notes: "Р”РѕРґР°С”С‚СЊСЃСЏ РґР»СЏ РїРѕРІРµСЂС…С–РІ РІРёС‰Рµ РґСЂСѓРіРѕРіРѕ.",
              is_discount: false,
              sort_order: 3,
            },
          ],
        },
      ];

      for (const formula of formulaComponents) {
        const formulaId = formulaIds.get(formula.formulaKey);
        if (!formulaId) {
          continue;
        }

        // FIX: use upsert on "id" instead of replaceScopedRows.
        // replaceScopedRows (delete + insert) fails on re-runs because the fixed
        // component UUIDs already exist in the table after the first seed.
        // Upserting on "id" does INSERT ... ON CONFLICT (id) DO UPDATE, which is
        // idempotent and safe for any number of re-runs.
        await upsertRows({
          table: "formula_components",
          rows: formula.rows.map((row) => ({
            id: row.id,
            formula_id: formulaId,
            type: row.type,
            label: row.label,
            preset_id: row.presetKey ? presetIds.get(row.presetKey) ?? null : null,
            expression: row.expression,
            condition: row.condition,
            notes: row.notes,
            is_discount: row.is_discount,
            sort_order: row.sort_order,
            created_at: now,
            updated_at: now,
          })),
          onConflict: "id",
          label: `formula components ${formula.formulaKey}`,
          optional: true,
        });
      }
    }
  }

  await upsertRows({ table: "projects", rows: projectRows, onConflict: "slug", label: "projects" });
  await applyPartialUpdates({
    table: "projects",
    rows: projectPatchRows,
    key: "slug",
    label: "project optional fields",
    optional: true,
  });

  await upsertRows({ table: "services", rows: serviceRows, onConflict: "slug", label: "services" });
  await applyPartialUpdates({
    table: "services",
    rows: servicePatchRows,
    key: "slug",
    label: "service rich fields",
    optional: true,
  });

  await upsertRows({ table: "products", rows: productRows, onConflict: "slug", label: "products" });

  const projectIds = await fetchIdMap({
    table: "projects",
    key: "slug",
    values: projectRows.map((row) => String(row.slug)),
    label: "project ids",
  });

  const productIds = await fetchIdMap({
    table: "products",
    key: "slug",
    values: productRows.map((row) => String(row.slug)),
    label: "product ids",
  });

  await applyPartialUpdates({
    table: "products",
    rows: [
      { slug: "vkhidni-dveri-z-duba-premium", formula_id: formulaIds.get("door_entry_oak_v1") ?? null, priority: 9 },
      { slug: "kukhnia-z-yasenia-linea", formula_id: formulaIds.get("kitchen_furniture_ash_v1") ?? null, priority: 8 },
      { slug: "shafa-harderob-yasen-frame", formula_id: formulaIds.get("kitchen_furniture_ash_v1") ?? null, priority: 7 },
      { slug: "vikno-pvh-komfort", formula_id: formulaIds.get("window_pvc_install_v1") ?? null, priority: 8 },
    ],
    key: "slug",
    label: "product pricing links",
    optional: true,
  });

  await upsertRows({
    table: "project_products",
    rows: [
      { project_id: requireId(projectIds, "vkhidni-dubovi-dveri-kyiv", "project"), product_id: requireId(productIds, "vkhidni-dveri-z-duba-premium", "product"), quantity: 1, notes: "РћСЃРЅРѕРІРЅРёР№ РґРІРµСЂРЅРёР№ Р±Р»РѕРє", sort_order: 0, created_at: now },
      { project_id: requireId(projectIds, "kukhnia-z-yasenia-lviv", "project"), product_id: requireId(productIds, "kukhnia-z-yasenia-linea", "product"), quantity: 1, notes: "РљСѓС…РѕРЅРЅРёР№ РєРѕРјРїР»РµРєС‚", sort_order: 0, created_at: now },
      { project_id: requireId(projectIds, "kukhnia-z-yasenia-lviv", "project"), product_id: requireId(productIds, "shafa-harderob-yasen-frame", "product"), quantity: 1, notes: "Р”РѕРґР°С‚РєРѕРІР° С€Р°С„Р°-РіР°СЂРґРµСЂРѕР±", sort_order: 1, created_at: now },
      { project_id: requireId(projectIds, "panoramni-vikna-pvh-dnipro", "project"), product_id: requireId(productIds, "vikno-pvh-komfort", "product"), quantity: 2, notes: "Р”РІР° РѕРґРЅР°РєРѕРІС– РІС–РєРѕРЅРЅС– Р±Р»РѕРєРё", sort_order: 0, created_at: now },
      { project_id: requireId(projectIds, "ofisni-dveri-nda", "project"), product_id: requireId(productIds, "vkhidni-dveri-z-duba-premium", "product"), quantity: 4, notes: "Р РµС„РµСЂРµРЅСЃРЅРёР№ РїСЂРѕРґСѓРєС‚ РґР»СЏ NDA-РїСЂРѕС”РєС‚Сѓ", sort_order: 0, created_at: now },
    ],
    onConflict: "project_id,product_id",
    label: "project products",
  });

  await upsertRows({ table: "testimonials", rows: testimonialRows(projectIds), onConflict: "id", label: "testimonials" });
  await upsertRows({ table: "site_settings", rows: siteSettingsRows, onConflict: "key", label: "site settings" });

  await upsertCompanyInfo({
    id: fixedIds.companyInfo,
    name: "РЎРІС–С‚Р»РёС†СЏ РњР°Р№СЃС‚СЂР°",
    tagline: "РђРІС‚РѕСЂСЃСЊРєС– РґРІРµСЂС–, РјРµР±Р»С– С‚Р° РІС–РєРЅР° Р· РґРµСЂРµРІР° С– РџР’РҐ",
    description:
      "РњР°Р№СЃС‚РµСЂРЅСЏ, С‰Рѕ РїСЂР°С†СЋС” РЅР° СЃС‚РёРєСѓ СЂРµРјРµСЃР»Р°, С„СѓРЅРєС†С–С— С‚Р° СЃСѓС‡Р°СЃРЅРѕС— Р°СЂС…С–С‚РµРєС‚СѓСЂРё. РњРё РІРёРіРѕС‚РѕРІР»СЏС”РјРѕ РґРІРµСЂС–, РјРµР±Р»С–, РІС–РєРЅР° С‚Р° Р±РµСЂРµРјРѕСЃСЏ Р·Р° СЂРµСЃС‚Р°РІСЂР°С†С–СЋ СЂРµС‡РµР№, СЏРєС– РјР°СЋС‚СЊ С†С–РЅРЅС–СЃС‚СЊ.",
    founded_year: 2015,
    email: "info@svitlytsya.ua",
    phone: "+380 (67) 000-00-00",
    phone_secondary: "+380 (50) 000-00-00",
    address: "РІСѓР». РЎРѕРЅСЏС‡РЅР°, 22",
    city: "РљРёС—РІ",
    country: "РЈРєСЂР°С—РЅР°",
    working_hours: "РџРЅ-РџС‚ 9:00-18:00",
    logo_url: null,
    og_image_url: media.workshop,
    social_facebook: "https://facebook.com/svitlytsya",
    social_instagram: "https://instagram.com/svitlytsya",
    social_youtube: null,
    social_tiktok: null,
    team_members: [
      { id: "team-1", name: "РњР°СЂРёРЅР° РЎ.", role: "РљРµСЂС–РІРЅРёС†СЏ РїСЂРѕС”РєС‚С–РІ", photo_url: media.teamOne },
      { id: "team-2", name: "РђРЅРґСЂС–Р№ Рљ.", role: "Р“РѕР»РѕРІРЅРёР№ РјР°Р№СЃС‚РµСЂ", photo_url: media.teamTwo },
    ],
    certificates: [
      { title: "Р“Р°СЂР°РЅС‚С–СЏ РЅР° РјРѕРЅС‚Р°Р¶", year: 2026 },
      { title: "Р’РЅСѓС‚СЂС–С€РЅС–Р№ СЃС‚Р°РЅРґР°СЂС‚ СЏРєРѕСЃС‚С– РїРѕРєСЂРёС‚С‚СЏ", year: 2026 },
    ],
    updated_at: now,
  });

  await upsertRows({ table: "inquiries", rows: inquiryRows(projectIds), onConflict: "id", label: "inquiries" });

  await upsertRows({
    table: "ai_chat_sessions",
    rows: [
      {
        id: fixedIds.aiSessionDoor,
        session_id: "seed-door-session",
        language: "uk",
        user_id: null,
        messages_count: 3,
        resulted_in_inquiry: true,
        inquiry_id: fixedIds.inquiryDoor,
        created_at: now,
        last_message_at: now,
      },
    ],
    onConflict: "id",
    label: "ai chat sessions",
    optional: true,
  });

  const aiSessionIds = await fetchIdMap({
    table: "ai_chat_sessions",
    key: "session_id",
    values: ["seed-door-session"],
    label: "ai session ids",
    optional: true,
  });

  const doorSessionId = aiSessionIds.get("seed-door-session");
  if (doorSessionId) {
    await replaceScopedRows({
      table: "ai_chat_messages",
      scopeKey: "chat_session_id",
      scopeValue: doorSessionId,
      label: "ai chat messages",
      optional: true,
      rows: [
        { id: fixedIds.aiMessageDoor1, chat_session_id: doorSessionId, role: "user", content: "РџРѕС‚СЂС–Р±РЅС– РІС…С–РґРЅС– РґРІРµСЂС– Р· РґСѓР±Р°. Р§Рё РјРѕР¶РЅР° РїСЂРёР±Р»РёР·РЅРѕ РїРѕСЂР°С…СѓРІР°С‚Рё РІР°СЂС‚С–СЃС‚СЊ?", tokens_used: 18, created_at: now },
        { id: fixedIds.aiMessageDoor2, chat_session_id: doorSessionId, role: "assistant", content: "РўР°Рє, РґР»СЏ РѕСЂС–С”РЅС‚РёСЂСѓ РїРѕС‚СЂС–Р±РЅС– СЂРѕР·РјС–СЂРё, РєС–Р»СЊРєС–СЃС‚СЊ С– С‡Рё Р±СѓРґРµ СЃРєР»С–РЅРЅСЏ. РџС–СЃР»СЏ С†СЊРѕРіРѕ РјРё Р·РјРѕР¶РµРјРѕ РґР°С‚Рё РїРѕРїРµСЂРµРґРЅС–Р№ СЂРѕР·СЂР°С…СѓРЅРѕРє.", tokens_used: 32, created_at: now },
        { id: fixedIds.aiMessageDoor3, chat_session_id: doorSessionId, role: "user", content: "Р РѕР·РјС–СЂ 0.9 РЅР° 2.1, РѕРґРЅС– РґРІРµСЂС–, РјР°С‚РѕРІРµ СЃРєР»Рѕ РїРѕС‚СЂС–Р±РЅРµ.", tokens_used: 16, created_at: now },
      ],
    });
  }

  await applyPartialUpdates({
    table: "inquiries",
    key: "id",
    label: "inquiry channels and configurations",
    optional: true,
    rows: [
      { id: fixedIds.inquiryDoor, channel: "ai_chat", chat_session_id: fixedIds.aiSessionDoor, configuration: { product_type: "door", width_m: 0.9, height_m: 2.1, quantity: 1, has_glass: true } },
      { id: fixedIds.inquiryKitchen, channel: "phone", chat_session_id: null, configuration: { product_type: "furniture", area_m2: 7.2, quantity: 8, has_paint: true } },
      { id: fixedIds.inquiryWindow, channel: "web_form", chat_session_id: null, configuration: { product_type: "window", width_m: 1.8, height_m: 1.5, quantity: 2, floors: 3 } },
    ],
  });

  await upsertRows({
    table: "orders",
    rows: [
      { order_number: "SM-2026-001", inquiry_id: fixedIds.inquiryDoor, user_id: null, status: "production", expected_date: "2026-04-10", actual_date: null, internal_notes: "РљР»С–С”РЅС‚ РїСЂРѕСЃРёС‚СЊ С‚РёС…РёР№ Р·Р°РјРѕРє С– РјР°С‚РѕРІРµ СЃРєР»Рѕ.", priority: "urgent", created_at: now, updated_at: now },
      { order_number: "SM-2026-002", inquiry_id: fixedIds.inquiryKitchen, user_id: null, status: "design", expected_date: "2026-04-24", actual_date: null, internal_notes: "РџРѕС‚СЂС–Р±РЅРѕ СѓР·РіРѕРґРёС‚Рё РЅР°РїРѕРІРЅРµРЅРЅСЏ РїРµРЅР°Р»Р° С‚Р° РѕСЃС‚СЂС–РІ.", priority: "normal", created_at: now, updated_at: now },
    ],
    onConflict: "order_number",
    label: "orders",
  });

  const orderIds = await fetchIdMap({
    table: "orders",
    key: "order_number",
    values: ["SM-2026-001", "SM-2026-002"],
    label: "order ids",
  });

  await applyPartialUpdates({
    table: "orders",
    key: "order_number",
    label: "order product and project links",
    optional: true,
    rows: [
      { order_number: "SM-2026-001", product_id: productIds.get("vkhidni-dveri-z-duba-premium") ?? null, project_id: projectIds.get("vkhidni-dubovi-dveri-kyiv") ?? null },
      { order_number: "SM-2026-002", product_id: productIds.get("kukhnia-z-yasenia-linea") ?? null, project_id: projectIds.get("kukhnia-z-yasenia-lviv") ?? null },
    ],
  });

  const orderOneId = orderIds.get("SM-2026-001");
  if (orderOneId) {
    await replaceScopedRows({
      table: "order_items",
      scopeKey: "order_id",
      scopeValue: orderOneId,
      label: "order items SM-2026-001",
      optional: true,
      rows: [
        { id: fixedIds.orderItem1, order_id: orderOneId, product_id: requireId(productIds, "vkhidni-dveri-z-duba-premium", "product"), quantity: 1, unit_price: 38750, notes: "Р”СѓР±РѕРІС– РІС…С–РґРЅС– РґРІРµСЂС– Р·С– СЃРєР»РѕРј", sort_order: 0, created_at: now },
      ],
    });

    await replaceScopedRows({
      table: "order_status_history",
      scopeKey: "order_id",
      scopeValue: orderOneId,
      label: "order history SM-2026-001",
      optional: true,
      rows: [
        { id: fixedIds.orderHistory1, order_id: orderOneId, from_status: null, to_status: "new", comment: "Р—Р°РјРѕРІР»РµРЅРЅСЏ СЃС‚РІРѕСЂРµРЅРѕ Р· Р·Р°СЏРІРєРё.", is_visible_to_client: true, created_by: null, created_at: now },
        { id: fixedIds.orderHistory2, order_id: orderOneId, from_status: "new", to_status: "consulting", comment: "РџРѕРіРѕРґР¶СѓС”РјРѕ РјР°С‚РµСЂС–Р°Р», СЃРєР»С–РЅРЅСЏ С‚Р° С„СѓСЂРЅС–С‚СѓСЂСѓ.", is_visible_to_client: true, created_by: null, created_at: now },
        { id: fixedIds.orderHistory3, order_id: orderOneId, from_status: "consulting", to_status: "production", comment: "Р—Р°РїСѓС‰РµРЅРѕ РІ С†РµС… РїС–СЃР»СЏ Р·Р°С‚РІРµСЂРґР¶РµРЅРЅСЏ РєСЂРµСЃР»РµРЅСЊ.", is_visible_to_client: true, created_by: null, created_at: now },
      ],
    });

    await replaceScopedRows({
      table: "order_messages",
      scopeKey: "order_id",
      scopeValue: orderOneId,
      label: "order messages SM-2026-001",
      optional: true,
      rows: [
        { id: fixedIds.orderMessage1, order_id: orderOneId, sender_type: "admin", sender_id: null, content: "РљСЂРµСЃР»РµРЅРЅСЏ РїРѕРіРѕРґР¶РµРЅРѕ, Р·Р°РїСѓСЃРєР°С”РјРѕ РґРІРµСЂС– Сѓ РІРёСЂРѕР±РЅРёС†С‚РІРѕ.", attachment_url: null, is_read: true, created_at: now },
        { id: fixedIds.orderMessage2, order_id: orderOneId, sender_type: "client", sender_id: null, content: "РџС–РґС‚РІРµСЂРґР¶СѓСЋ РјР°С‚РѕРІРµ СЃРєР»Рѕ Р№ С‚РµРјРЅРёР№ С„С–РЅС–С€.", attachment_url: null, is_read: true, created_at: now },
      ],
    });
  }

  const orderTwoId = orderIds.get("SM-2026-002");
  if (orderTwoId) {
    await replaceScopedRows({
      table: "order_items",
      scopeKey: "order_id",
      scopeValue: orderTwoId,
      label: "order items SM-2026-002",
      optional: true,
      rows: [
        { id: fixedIds.orderItem2, order_id: orderTwoId, product_id: requireId(productIds, "kukhnia-z-yasenia-linea", "product"), quantity: 1, unit_price: 68500, notes: "РћСЃРЅРѕРІРЅР° РєСѓС…РЅСЏ Р· РѕСЃС‚СЂРѕРІРѕРј", sort_order: 0, created_at: now },
        { id: fixedIds.orderItem3, order_id: orderTwoId, product_id: requireId(productIds, "shafa-harderob-yasen-frame", "product"), quantity: 1, unit_price: 39200, notes: "РћРєСЂРµРјР° С€Р°С„Р°-РіР°СЂРґРµСЂРѕР±", sort_order: 1, created_at: now },
      ],
    });

    await replaceScopedRows({
      table: "order_status_history",
      scopeKey: "order_id",
      scopeValue: orderTwoId,
      label: "order history SM-2026-002",
      optional: true,
      rows: [
        { id: fixedIds.orderHistory4, order_id: orderTwoId, from_status: null, to_status: "new", comment: "РћС‚СЂРёРјР°Р»Рё Р·Р°РїРёС‚ РІС–Рґ РєР»С–С”РЅС‚Р°.", is_visible_to_client: true, created_by: null, created_at: now },
        { id: fixedIds.orderHistory5, order_id: orderTwoId, from_status: "new", to_status: "design", comment: "Р“РѕС‚СѓС”РјРѕ РїР»Р°РЅСѓРІР°РЅРЅСЏ РєСѓС…РЅС– С‚Р° СЃС…РµРјСѓ РЅР°РїРѕРІРЅРµРЅРЅСЏ.", is_visible_to_client: true, created_by: null, created_at: now },
      ],
    });

    await replaceScopedRows({
      table: "order_messages",
      scopeKey: "order_id",
      scopeValue: orderTwoId,
      label: "order messages SM-2026-002",
      optional: true,
      rows: [
        { id: fixedIds.orderMessage3, order_id: orderTwoId, sender_type: "admin", sender_id: null, content: "РџС–РґРіРѕС‚СѓРІР°Р»Рё РїРµСЂС€РёР№ РІР°СЂС–Р°РЅС‚ РїР»Р°РЅСѓРІР°РЅРЅСЏ РєСѓС…РЅС– С‚Р° С€Р°С„Рё, С‡РµРєР°С”РјРѕ РЅР° РєРѕРјРµРЅС‚Р°СЂС–.", attachment_url: null, is_read: false, created_at: now },
      ],
    });
  }

  console.log("Seed completed.");
}

main().catch((error) => {
  console.error("Seed failed.");
  console.error(error);
  process.exit(1);
});
