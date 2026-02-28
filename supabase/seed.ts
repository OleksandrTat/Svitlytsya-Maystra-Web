import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

function loadEnvFromFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const envPaths = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of envPaths) {
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

const ids = {
  projectDoor: "10000000-0000-4000-8000-000000000001",
  projectFurniture: "10000000-0000-4000-8000-000000000002",
  projectWindow: "10000000-0000-4000-8000-000000000003",
  projectNda: "10000000-0000-4000-8000-000000000004",
  inquiry1: "30000000-0000-4000-8000-000000000001",
  inquiry2: "30000000-0000-4000-8000-000000000002",
  chatSession: "40000000-0000-4000-8000-000000000001",
  chatMsg1: "41000000-0000-4000-8000-000000000001",
  chatMsg2: "41000000-0000-4000-8000-000000000002",
  order1: "80000000-0000-4000-8000-000000000001",
  formula1: "71000000-0000-4000-8000-000000000001",
  preset1: "70000000-0000-4000-8000-000000000001",
  component1: "72000000-0000-4000-8000-000000000001",
};

const projects: Row[] = [
  {
    id: ids.projectDoor,
    title: "Вхідні дубові двері",
    slug: "oak-entrance-door",
    description: "Вхідний блок з масиву дуба.",
    category: "doors",
    style: ["класика"],
    materials: ["дуб", "метал"],
    dimensions: "1100 x 2300 мм",
    location: "Київ",
    completed_at: "2025-11-17",
    duration_days: 24,
    status: "public",
    is_featured: true,
    cover_image:
      "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1400&q=80",
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: ids.projectFurniture,
    title: "Кухня з ясеня",
    slug: "ash-kitchen-set",
    description: "Кухонний комплект під індивідуальні розміри.",
    category: "furniture",
    style: ["мінімалізм"],
    materials: ["ясен", "скло"],
    dimensions: "3.8м + 2.1м",
    location: "Львів",
    completed_at: "2025-09-03",
    duration_days: 31,
    status: "public",
    is_featured: true,
    cover_image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: ids.projectWindow,
    title: "Панорамні ПВХ вікна",
    slug: "panoramic-pvc-windows",
    description: "Енергоефективні віконні системи.",
    category: "windows",
    style: ["модерн"],
    materials: ["ПВХ", "скло"],
    dimensions: "2400 x 2100 мм",
    location: "Дніпро",
    completed_at: "2025-07-21",
    duration_days: 12,
    status: "public",
    is_featured: true,
    cover_image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80",
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: ids.projectNda,
    title: "Офісні двері під NDA",
    slug: "office-doors-nda",
    description: "Проєкт з обмеженим публічним доступом.",
    category: "doors",
    style: ["мінімалізм"],
    materials: ["дуб", "метал"],
    dimensions: "1200 x 2400 мм",
    location: "Київ",
    completed_at: "2024-12-11",
    duration_days: 21,
    status: "nda",
    is_featured: false,
    cover_image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
    ],
    created_at: now,
    updated_at: now,
  },
];

const projectPrivacyPatch: Row[] = [
  { id: ids.projectDoor, privacy_level: "public", blurred_images: [] },
  { id: ids.projectFurniture, privacy_level: "public", blurred_images: [] },
  { id: ids.projectWindow, privacy_level: "public", blurred_images: [] },
  {
    id: ids.projectNda,
    privacy_level: "nda_partial",
    blurred_images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=30",
    ],
  },
];

const services: Row[] = [
  {
    title: "Двері на замовлення",
    slug: "custom-doors",
    short_description: "Вхідні та міжкімнатні двері.",
    description: "Виготовлення дверей під ваші розміри.",
    process_steps: ["Запит", "Замір", "Проєкт", "Виробництво", "Монтаж"],
    cover_image:
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1200&q=80",
    sort_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    title: "Меблі на замовлення",
    slug: "custom-furniture",
    short_description: "Кухні, шафи, гардероби.",
    description: "Корпусні меблі за індивідуальними параметрами.",
    process_steps: ["Запит", "Обміри", "Проєкт", "Виготовлення", "Монтаж"],
    cover_image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    sort_order: 2,
    created_at: now,
    updated_at: now,
  },
  {
    title: "Вікна ПВХ",
    slug: "pvc-windows",
    short_description: "Енергоефективні віконні системи.",
    description: "Підбір профілю, виготовлення та монтаж.",
    process_steps: ["Огляд", "Підбір", "Виготовлення", "Монтаж"],
    cover_image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    sort_order: 3,
    created_at: now,
    updated_at: now,
  },
  {
    title: "Реставрація",
    slug: "restoration",
    short_description: "Відновлення дерев'яних виробів.",
    description: "Реставрація дверей, рам і меблів.",
    process_steps: ["Оцінка", "Тест", "Реставрація", "Фініш"],
    cover_image:
      "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?auto=format&fit=crop&w=1200&q=80",
    sort_order: 4,
    created_at: now,
    updated_at: now,
  },
];

const testimonials: Row[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    author_name: "Олена К.",
    author_location: "Київ",
    content: "Все виконано якісно і вчасно.",
    rating: 5,
    project_id: ids.projectDoor,
    is_visible: true,
    created_at: now,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    author_name: "Сергій М.",
    author_location: "Львів",
    content: "Кухня вийшла дуже зручною.",
    rating: 5,
    project_id: ids.projectFurniture,
    is_visible: true,
    created_at: now,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    author_name: "Ірина П.",
    author_location: "Дніпро",
    content: "Після монтажу вікон стало тихо і тепло.",
    rating: 4,
    project_id: ids.projectWindow,
    is_visible: true,
    created_at: now,
  },
];

const siteSettings: Row[] = [
  {
    key: "contacts",
    value: {
      phone: "+380 (67) 000-00-00",
      email: "info@svitlytsya.ua",
      address: "Вул. Сонячна, 22, Слобідка, Тернопільська область, Україна, 47632",
      hours: "Пн-Пт: 09:00-18:00",
    },
    description: "Контакти",
    created_at: now,
    updated_at: now,
  },
  {
    key: "seo_home",
    value: {
      title: "Svitlytsya Maystra — двері, меблі, вікна",
      description: "Сімейна майстерня з 26+ роками досвіду.",
    },
    description: "SEO головної",
    created_at: now,
    updated_at: now,
  },
  {
    key: "ai_chat_system_prompt",
    value: "Ти цифровий помічник майстерні. Відповідай українською та не давай точних цін.",
    description: "Prompt для AI чату",
    created_at: now,
    updated_at: now,
  },
];

const inquiriesBase: Row[] = [
  {
    id: ids.inquiry1,
    name: "Ігор Шевчук",
    phone: "+380671112233",
    email: "igor@example.com",
    service_type: "Двері",
    message: "Потрібні вхідні дубові двері.",
    source_page: "/catalog/oak-entrance-door",
    project_ref_id: ids.projectDoor,
    status: "new",
    created_at: now,
  },
  {
    id: ids.inquiry2,
    name: "Анна Коваль",
    phone: "+380671112244",
    email: "anna@example.com",
    service_type: "Меблі",
    message: "Цікавить кухня з ясеня.",
    source_page: "/constructor/door",
    project_ref_id: ids.projectFurniture,
    status: "in_progress",
    created_at: now,
  },
];

const aiChatSessions: Row[] = [
  {
    id: ids.chatSession,
    session_id: "seed-session-001",
    language: "uk",
    user_id: null,
    messages_count: 2,
    resulted_in_inquiry: true,
    inquiry_id: ids.inquiry1,
    created_at: now,
    last_message_at: now,
  },
];

const aiChatMessages: Row[] = [
  {
    id: ids.chatMsg1,
    chat_session_id: ids.chatSession,
    role: "user",
    content: "Скільки орієнтовно коштують двері?",
    tokens_used: 14,
    created_at: now,
  },
  {
    id: ids.chatMsg2,
    chat_session_id: ids.chatSession,
    role: "assistant",
    content: "Орієнтовно від 25 000 до 60 000 грн, залежно від конфігурації.",
    tokens_used: 23,
    created_at: now,
  },
];

const inquiriesStage2Patch: Row[] = [
  {
    id: ids.inquiry1,
    chat_session_id: ids.chatSession,
    configuration: {
      product_type: "door",
      door_type: "entry",
      material: "oak",
      color: "natural",
      size: "200x90",
      configuration_key: "entry_oak_natural_no-glass_modern_200x90",
    },
  },
];

const productConfigurations: Row[] = [
  {
    configuration_key: "entry_oak_natural_no-glass_modern_200x90",
    product_type: "door",
    parameters: { door_type: "entry", material: "oak", color: "natural", size: "200x90" },
    image_url:
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1400&q=80",
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    configuration_key: "interior_mdf_white_clear_minimal_custom",
    product_type: "door",
    parameters: { door_type: "interior", material: "mdf", color: "white", size: "custom" },
    image_url:
      "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1400&q=80",
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    configuration_key: "wardrobe_oak_natural",
    product_type: "furniture",
    parameters: { furniture_type: "wardrobe", material: "oak", color: "natural" },
    image_url:
      "https://images.unsplash.com/photo-1616594039964-3ad6f5f1f5f5?auto=format&fit=crop&w=1400&q=80",
    is_active: true,
    created_at: now,
    updated_at: now,
  },
];

const blogPosts: Row[] = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    title: "Як обрати деревину для вхідних дверей",
    slug: "how-to-choose-wood-for-entry-door",
    excerpt: "Порівнюємо дуб, ясен і сосну для вхідних дверей.",
    content: "<p>Короткий гайд по вибору матеріалу.</p>",
    cover_image:
      "https://images.unsplash.com/photo-1452457005517-a9c9bdf89df5?auto=format&fit=crop&w=1400&q=80",
    category: "Матеріали",
    tags: ["двері", "дуб"],
    reading_time_min: 4,
    is_published: true,
    published_at: "2026-01-10T10:00:00.000Z",
    seo_title: "Як обрати деревину для вхідних дверей",
    seo_description: "Практичний гайд по вибору матеріалу.",
    created_at: now,
    updated_at: now,
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    title: "5 правил догляду за дерев'яними меблями",
    slug: "five-rules-for-wood-furniture-care",
    excerpt: "Прості кроки, які продовжують термін служби меблів.",
    content: "<p>Регулярний догляд продовжує життя меблів.</p>",
    cover_image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80",
    category: "Догляд",
    tags: ["меблі", "догляд"],
    reading_time_min: 3,
    is_published: true,
    published_at: "2026-01-15T10:00:00.000Z",
    seo_title: "5 правил догляду за меблями",
    seo_description: "Поради майстерні для щоденного догляду.",
    created_at: now,
    updated_at: now,
  },
];

const culturalPosts: Row[] = [
  {
    id: "51000000-0000-4000-8000-000000000001",
    title: "Традиція різьблення по дереву",
    slug: "wood-carving-tradition",
    excerpt: "Як ремісничі техніки працюють у сучасному інтер'єрі.",
    content: "<p>Коротке есе про дерево і ремесло.</p>",
    cover_image:
      "https://images.unsplash.com/photo-1452457750107-c7d7f65d8a3f?auto=format&fit=crop&w=1400&q=80",
    category: "Ремесло",
    tags: ["традиції", "дерево"],
    reading_time_min: 6,
    is_published: true,
    published_at: "2026-01-12T12:00:00.000Z",
    seo_title: "Традиція різьблення по дереву",
    seo_description: "Культурний контекст ремесла.",
    guest_author_name: "Марко Г.",
    guest_author_bio: "Дослідник народного мистецтва.",
    allow_comments: true,
    comments_count: 0,
    created_at: now,
    updated_at: now,
  },
  {
    id: "51000000-0000-4000-8000-000000000002",
    title: "Дерево в архітектурі Карпат",
    slug: "wood-in-carpathian-architecture",
    excerpt: "Ключові принципи матеріалу в гірському будівництві.",
    content: "<p>Короткий нарис про архітектурну традицію.</p>",
    cover_image:
      "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1400&q=80",
    category: "Архітектура",
    tags: ["карпати", "архітектура"],
    reading_time_min: 5,
    is_published: true,
    published_at: "2026-01-19T12:00:00.000Z",
    seo_title: "Дерево в архітектурі Карпат",
    seo_description: "Традиційні та сучасні принципи використання дерева.",
    guest_author_name: null,
    guest_author_bio: null,
    allow_comments: true,
    comments_count: 0,
    created_at: now,
    updated_at: now,
  },
];

const pricePresets: Row[] = [
  {
    id: ids.preset1,
    name: "oak_sheet_per_m2",
    category: "material",
    unit: "м²",
    value: 850,
    currency: "UAH",
    notes: "Дубовий листовий матеріал",
    created_at: now,
    updated_at: now,
  },
];

const priceFormulas: Row[] = [
  {
    id: ids.formula1,
    name: "door_interior_oak",
    product_type: "door",
    description: "Базова формула дверей",
    input_schema: [
      { key: "width_m", type: "number", unit: "m" },
      { key: "height_m", type: "number", unit: "m" },
    ],
    is_active: true,
    created_at: now,
    updated_at: now,
  },
];

const formulaComponents: Row[] = [
  {
    id: ids.component1,
    formula_id: ids.formula1,
    type: "material",
    label: "Дуб листовий",
    preset_id: ids.preset1,
    expression: "preset_value * width_m * height_m * 1.3",
    condition: null,
    sort_order: 1,
    created_at: now,
  },
];

const orders: Row[] = [
  {
    order_number: "SM-2026-001",
    inquiry_id: ids.inquiry1,
    user_id: null,
    status: "production",
    expected_date: "2026-03-20",
    actual_date: null,
    internal_notes: "Клієнт просить тихий замок.",
    priority: "urgent",
    created_at: now,
    updated_at: now,
  },
];

const optionalErrorCodes = new Set(["42P01", "42703", "PGRST204", "PGRST205"]);

function isSchemaOptionalError(error: { code?: string } | null) {
  return Boolean(error?.code && optionalErrorCodes.has(error.code));
}

async function upsertRows(params: {
  table: string;
  rows: Row[];
  onConflict: string;
  optional?: boolean;
}) {
  const { table, rows, onConflict, optional = false } = params;
  if (rows.length === 0) return;

  console.log(`Seeding ${table}...`);
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (!error) return;

  if (optional && isSchemaOptionalError(error)) {
    console.warn(`Skipping ${table}: ${error.message}`);
    return;
  }

  throw error;
}

async function applyPartialUpdates(
  table: string,
  patches: Row[],
  key: string = "id",
  label?: string,
) {
  for (const patch of patches) {
    const keyValue = patch[key];
    if (!keyValue) continue;

    const { [key]: _, ...changes } = patch;
    const { error } = await supabase.from(table).update(changes).eq(key, String(keyValue));

    if (!error) continue;

    if (isSchemaOptionalError(error)) {
      console.warn(`Skipping ${label ?? table} patch: ${error.message}`);
      return;
    }

    throw error;
  }
}

async function run() {
  await upsertRows({ table: "projects", rows: projects, onConflict: "slug" });
  await applyPartialUpdates("projects", projectPrivacyPatch, "id", "project privacy");
  await upsertRows({ table: "services", rows: services, onConflict: "slug" });
  await upsertRows({ table: "testimonials", rows: testimonials, onConflict: "id" });
  await upsertRows({ table: "site_settings", rows: siteSettings, onConflict: "key" });
  await upsertRows({ table: "inquiries", rows: inquiriesBase, onConflict: "id" });

  await upsertRows({ table: "ai_chat_sessions", rows: aiChatSessions, onConflict: "session_id", optional: true });
  await upsertRows({ table: "ai_chat_messages", rows: aiChatMessages, onConflict: "id", optional: true });
  await applyPartialUpdates("inquiries", inquiriesStage2Patch, "id", "inquiries stage2");
  await upsertRows({
    table: "product_configurations",
    rows: productConfigurations,
    onConflict: "configuration_key",
    optional: true,
  });

  await upsertRows({ table: "blog_posts", rows: blogPosts, onConflict: "slug", optional: true });
  await upsertRows({ table: "cultural_blog_posts", rows: culturalPosts, onConflict: "slug", optional: true });
  await upsertRows({ table: "price_presets", rows: pricePresets, onConflict: "name", optional: true });
  await upsertRows({ table: "price_formulas", rows: priceFormulas, onConflict: "name", optional: true });
  await upsertRows({ table: "formula_components", rows: formulaComponents, onConflict: "id", optional: true });
  await upsertRows({ table: "orders", rows: orders, onConflict: "order_number", optional: true });

  console.log("Seed completed.");
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
