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
    title: "Вхідні дубові двері для приватного будинку",
    slug: "vkhidni-dubovi-dveri-kyiv",
    description:
      "Індивідуальний комплект вхідних дверей з масиву дуба, прихованим утепленням та преміальною фурнітурою.",
    category: "doors",
    style: ["класика", "сучасна різьба"],
    materials: ["дуб", "метал", "матове скло"],
    dimensions: "1100 x 2300 мм",
    location: "Київ",
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
    title: "Кухня з ясеня для квартири у Львові",
    slug: "kukhnia-z-yasenia-lviv",
    description:
      "Кухонний комплект з натурального ясеня, фарбованими фасадами та вбудованими системами зберігання.",
    category: "furniture",
    style: ["мінімалізм", "теплий сучасний"],
    materials: ["ясен", "МДФ", "скло"],
    dimensions: "3.8 м + острів 1.9 м",
    location: "Львів",
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
    title: "Панорамні ПВХ-вікна для тераси",
    slug: "panoramni-vikna-pvh-dnipro",
    description:
      "Енергоефективні віконні блоки з монтажем, теплим склопакетом та акуратною внутрішньою обробкою.",
    category: "windows",
    style: ["сучасний", "мінімалізм"],
    materials: ["ПВХ", "скло", "метал"],
    dimensions: "2400 x 2100 мм",
    location: "Дніпро",
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
    title: "Офісні двері під NDA",
    slug: "ofisni-dveri-nda",
    description:
      "Комплект міжкімнатних дверей для офісного простору з обмеженим публічним доступом до деталей реалізації.",
    category: "doors",
    style: ["мінімалізм"],
    materials: ["дуб", "метал"],
    dimensions: "1200 x 2400 мм",
    location: "Київ",
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
    seo_title: "Вхідні дубові двері на замовлення в Києві",
    seo_description:
      "Портфоліо авторських вхідних дверей з масиву дуба: матеріали, стиль, термін виробництва та фінальний результат.",
    blurred_images: [],
    private_client_name: null,
    private_location: null,
    private_notes: null,
  },
  {
    slug: "kukhnia-z-yasenia-lviv",
    privacy_level: "public",
    sort_order: 2,
    seo_title: "Кухня з ясеня на замовлення у Львові",
    seo_description:
      "Кейс кухні з натурального ясеня з індивідуальним проєктуванням, підбором фурнітури та монтажем.",
    blurred_images: [],
    private_client_name: null,
    private_location: null,
    private_notes: null,
  },
  {
    slug: "panoramni-vikna-pvh-dnipro",
    privacy_level: "public",
    sort_order: 3,
    seo_title: "Панорамні ПВХ-вікна з монтажем у Дніпрі",
    seo_description:
      "Приклад реалізації панорамних ПВХ-вікон з енергоефективним склопакетом і монтажем під ключ.",
    blurred_images: [],
    private_client_name: null,
    private_location: null,
    private_notes: null,
  },
  {
    slug: "ofisni-dveri-nda",
    privacy_level: "nda_partial",
    sort_order: 4,
    seo_title: "Офісні двері під NDA",
    seo_description:
      "Закритий корпоративний проєкт. Частина деталей та фото приховані відповідно до умов конфіденційності.",
    blurred_images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=30",
    ],
    private_client_name: "Конфіденційний клієнт",
    private_location: "Київ",
    private_notes: "Публічні фото обмежені умовами NDA.",
  },
];

const serviceRows: Row[] = [
  {
    title: "Авторські двері",
    slug: "dveri-na-zamovlennia",
    short_description: "Вхідні та міжкімнатні двері з натурального дерева під ваші розміри.",
    description:
      "Проєктуємо і виготовляємо двері, які працюють як архітектурний акцент: матеріал, конструкція, покриття і фурнітура підбираються під конкретний простір.",
    process_steps: [
      { step: 1, title: "Бриф", description: "Обговорюємо задачу, стиль інтер'єру та бюджет." },
      { step: 2, title: "Заміри", description: "Фіксуємо проріз, вузли монтажу та технічні обмеження." },
      { step: 3, title: "Виробництво", description: "Готуємо креслення, погоджуємо зразки та запускаємо в цех." },
      { step: 4, title: "Монтаж", description: "Доставляємо, встановлюємо й здаємо готовий виріб." },
    ],
    cover_image: media.doorHero,
    sort_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    title: "Меблі на замовлення",
    slug: "mebli-na-zamovlennia",
    short_description: "Кухні, шафи, гардеробні й корпусні рішення під конкретний сценарій життя.",
    description:
      "Створюємо меблі, які працюють не лише візуально, а й функціонально: від планування наповнення до монтажу на об'єкті.",
    process_steps: [
      { step: 1, title: "Планування", description: "Збираємо референси та побутові сценарії користування." },
      { step: 2, title: "Ескізи", description: "Пропонуємо конфігурацію, матеріали та фурнітуру." },
      { step: 3, title: "Цех", description: "Виготовляємо корпуси, фасади та тестуємо вузли." },
      { step: 4, title: "Монтаж", description: "Збираємо меблі на об'єкті та фінально регулюємо фасади." },
    ],
    cover_image: media.kitchenHero,
    sort_order: 2,
    created_at: now,
    updated_at: now,
  },
  {
    title: "Вікна ПВХ",
    slug: "vikna-pvh",
    short_description: "Теплі ПВХ-вікна з підбором профілю, виготовленням і монтажем.",
    description:
      "Допомагаємо підібрати конфігурацію вікна під шум, клімат, монтажний вузол та архітектуру фасаду.",
    process_steps: [
      { step: 1, title: "Огляд", description: "Оцінюємо прорізи, відкривання та умови монтажу." },
      { step: 2, title: "Комплектація", description: "Підбираємо профіль, склопакет і фурнітуру." },
      { step: 3, title: "Виготовлення", description: "Запускаємо замовлення та контролюємо терміни." },
      { step: 4, title: "Монтаж", description: "Монтуємо, герметизуємо й перевіряємо роботу стулок." },
    ],
    cover_image: media.windowHero,
    sort_order: 3,
    created_at: now,
    updated_at: now,
  },
  {
    title: "Реставрація виробів",
    slug: "restavratsiia-derevianykh-vyrobiv",
    short_description: "Делікатне відновлення дверей, рам, меблів та декоративних елементів.",
    description:
      "Працюємо з цінними або емоційно важливими речами: від консервації та очищення до повного відновлення покриття.",
    process_steps: [
      { step: 1, title: "Діагностика", description: "Фіксуємо стан деревини, покриття та втрати." },
      { step: 2, title: "Проби", description: "Підбираємо метод очищення та колір майбутнього фінішу." },
      { step: 3, title: "Відновлення", description: "Ремонтуємо основу, шпонуємо й відновлюємо деталі." },
      { step: 4, title: "Фініш", description: "Наносимо захист і передаємо виріб замовнику." },
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
    tagline: "Двері, що говорять про вас",
    icon: "🚪",
    gallery: [media.doorHero, media.doorDetail],
    category: "production",
    features: [
      { title: "Індивідуальні розміри", description: "Від нестандартних прорізів до прихованих коробів." },
      { title: "Матеріали преміумкласу", description: "Дуб, ясен, МДФ, скло та металеві підсилення." },
      { title: "Монтаж під ключ", description: "Контроль геометрії, регулювання та фінішне приймання." },
    ],
    price_from: 28000,
    price_unit: "грн",
    duration_days_from: 18,
    duration_days_to: 35,
    is_active: true,
    is_featured: true,
    seo_title: "Авторські двері на замовлення",
    seo_description: "Виготовлення вхідних та міжкімнатних дверей на замовлення з натурального дерева.",
  },
  {
    slug: "mebli-na-zamovlennia",
    tagline: "Система зберігання, яка працює на щодень",
    icon: "🪑",
    gallery: [media.kitchenHero, media.kitchenDetail, media.wardrobeHero],
    category: "production",
    features: [
      { title: "Під ваш сценарій життя", description: "Ергономіка, логіка зберігання та доступ до кожної зони." },
      { title: "Гнучка комплектація", description: "Фурнітура, підсвітка, фарбування, шпон і системи відкривання." },
      { title: "Акуратний монтаж", description: "Доставка, збірка, регулювання та фінальна перевірка." },
    ],
    price_from: 42000,
    price_unit: "грн",
    duration_days_from: 20,
    duration_days_to: 45,
    is_active: true,
    is_featured: true,
    seo_title: "Меблі на замовлення для кухні, шаф та гардеробних",
    seo_description: "Індивідуальні меблі на замовлення з дерева та МДФ з проєктуванням і монтажем.",
  },
  {
    slug: "vikna-pvh",
    tagline: "Тепло, тиша і точний монтаж",
    icon: "🪟",
    gallery: [media.windowHero, media.windowDetail],
    category: "installation",
    features: [
      { title: "Підбір під об'єкт", description: "Рішення для квартири, будинку, офісу та великих прорізів." },
      { title: "Енергоефективність", description: "Оптимальні склопакети для тепла, шуму та інсоляції." },
      { title: "Сервіс після монтажу", description: "Регулювання та консультація з догляду після встановлення." },
    ],
    price_from: 16000,
    price_unit: "грн",
    duration_days_from: 7,
    duration_days_to: 16,
    is_active: true,
    is_featured: false,
    seo_title: "ПВХ-вікна з виготовленням і монтажем",
    seo_description: "Підбір, розрахунок, виготовлення та монтаж ПВХ-вікон під ключ.",
  },
  {
    slug: "restavratsiia-derevianykh-vyrobiv",
    tagline: "Зберігаємо те, що має історію",
    icon: "🛠️",
    gallery: [media.restorationHero, media.workshop],
    category: "restoration",
    features: [
      { title: "Делікатний підхід", description: "Працюємо з цінними та антикварними виробами без поспіху." },
      { title: "Проби до старту", description: "Погоджуємо текстуру, тон і фініш до початку основних робіт." },
      { title: "Повний цикл", description: "Від консервації до фінішного покриття та монтажу назад." },
    ],
    price_from: 12000,
    price_unit: "грн",
    duration_days_from: 10,
    duration_days_to: 28,
    is_active: true,
    is_featured: false,
    seo_title: "Реставрація дерев'яних дверей, меблів та рам",
    seo_description: "Професійна реставрація виробів з дерева з відновленням конструкції та покриття.",
  },
];

const pricePresetRows: Row[] = [
  { name: "Дуб (дошка)", variable_key: "oak_board", category: "material", unit: "м2", value: 1200, currency: "UAH", notes: "Ціна за м2 дубової дошки", created_at: now, updated_at: now },
  { name: "Ясен (дошка)", variable_key: "ash_board", category: "material", unit: "м2", value: 900, currency: "UAH", notes: "Ціна за м2 ясеневої дошки", created_at: now, updated_at: now },
  { name: "Сосна (дошка)", variable_key: "pine_board", category: "material", unit: "м2", value: 450, currency: "UAH", notes: "Ціна за м2 соснової дошки", created_at: now, updated_at: now },
  { name: "МДФ 16 мм", variable_key: "mdf_16", category: "material", unit: "м2", value: 280, currency: "UAH", notes: "Лист МДФ 16 мм", created_at: now, updated_at: now },
  { name: "Фанера 18 мм", variable_key: "plywood_18", category: "material", unit: "м2", value: 320, currency: "UAH", notes: "Фанера 18 мм", created_at: now, updated_at: now },
  { name: "Лак матовий", variable_key: "varnish_matte", category: "consumable", unit: "м2", value: 85, currency: "UAH", notes: "Лакування у 2 шари", created_at: now, updated_at: now },
  { name: "Фарба біла", variable_key: "paint_white", category: "consumable", unit: "м2", value: 120, currency: "UAH", notes: "Акрилова фарба", created_at: now, updated_at: now },
  { name: "Фурнітура стандарт", variable_key: "hardware_std", category: "material", unit: "комплект", value: 1800, currency: "UAH", notes: "Петлі, ручка, замок", created_at: now, updated_at: now },
  { name: "Фурнітура преміум", variable_key: "hardware_premium", category: "material", unit: "комплект", value: 4500, currency: "UAH", notes: "Преміальний комплект фурнітури", created_at: now, updated_at: now },
  { name: "Скло матове 4 мм", variable_key: "glass_frosted", category: "material", unit: "м2", value: 650, currency: "UAH", notes: "Матовe скло 4 мм", created_at: now, updated_at: now },
  { name: "Монтаж дверей", variable_key: "install_door", category: "labor", unit: "шт", value: 1500, currency: "UAH", notes: "Встановлення одного дверного блоку", created_at: now, updated_at: now },
  { name: "Монтаж вікна", variable_key: "install_window", category: "labor", unit: "шт", value: 2200, currency: "UAH", notes: "Встановлення одного вікна", created_at: now, updated_at: now },
  { name: "Столяр година", variable_key: "carpenter_hour", category: "labor", unit: "год", value: 250, currency: "UAH", notes: "Погодинна ставка майстра", created_at: now, updated_at: now },
  { name: "Цех за день", variable_key: "workshop_day", category: "overhead", unit: "день", value: 800, currency: "UAH", notes: "Амортизація цеху за день", created_at: now, updated_at: now },
  { name: "Доставка за км", variable_key: "delivery_km", category: "overhead", unit: "км", value: 15, currency: "UAH", notes: "Логістика за кілометр", created_at: now, updated_at: now },
];

const formulaInputDoor = [
  { key: "width_m", label: "Ширина", unit: "м", type: "number", default_value: 0.9, min: 0.5, max: 1.5 },
  { key: "height_m", label: "Висота", unit: "м", type: "number", default_value: 2.1, min: 1.8, max: 2.8 },
  { key: "quantity", label: "Кількість", unit: "шт", type: "number", default_value: 1, min: 1, max: 20 },
  { key: "has_glass", label: "Є скло", unit: "bool", type: "boolean", default_value: 0 },
];

const formulaInputFurniture = [
  { key: "area_m2", label: "Площа фасадів", unit: "м2", type: "number", default_value: 6, min: 1, max: 50 },
  { key: "quantity", label: "Кількість модулів", unit: "шт", type: "number", default_value: 6, min: 1, max: 50 },
  { key: "has_paint", label: "Потрібне фарбування", unit: "bool", type: "boolean", default_value: 1 },
];

const formulaInputWindow = [
  { key: "width_m", label: "Ширина", unit: "м", type: "number", default_value: 1.6, min: 0.5, max: 4 },
  { key: "height_m", label: "Висота", unit: "м", type: "number", default_value: 1.4, min: 0.5, max: 3 },
  { key: "quantity", label: "Кількість", unit: "шт", type: "number", default_value: 1, min: 1, max: 20 },
  { key: "floors", label: "Поверх", unit: "пов.", type: "number", default_value: 1, min: 1, max: 25 },
];

const priceFormulaRows: Row[] = [
  {
    name: "door_entry_oak_v1",
    product_type: "door",
    description: "Базова формула для вхідних дубових дверей з опціональним склінням.",
    input_schema: formulaInputDoor,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    name: "kitchen_furniture_ash_v1",
    product_type: "furniture",
    description: "Формула для кухонь та корпусних меблів на базі ясеня й МДФ.",
    input_schema: formulaInputFurniture,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    name: "window_pvc_install_v1",
    product_type: "window",
    description: "Формула розрахунку ПВХ-вікон з монтажем та логістикою.",
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
    title: "Вхідні двері з масиву дуба Premium",
    slug: "vkhidni-dveri-z-duba-premium",
    description:
      "Масивні вхідні двері з дуба з утепленням, металевим підсиленням та опцією декоративного скління.",
    short_description: "Дуб, преміальна фурнітура, індивідуальні розміри та кілька сценаріїв оздоблення.",
    category: "doors",
    materials: ["дуб", "метал", "скло"],
    style: ["сучасна класика"],
    cover_image: media.doorHero,
    images: [media.doorHero, media.doorDetail],
    price_from: 28000,
    status: "active",
    sort_order: 1,
    is_featured: true,
    seo_title: "Вхідні дубові двері Premium",
    seo_description: "Авторські вхідні двері з масиву дуба з індивідуальною комплектацією та монтажем.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "Кухня з ясеня Linea",
    slug: "kukhnia-z-yasenia-linea",
    description:
      "Кухня на замовлення з натурального ясеня, фарбованими фасадами, інтегрованими ручками та островом.",
    short_description: "Фасади з ясеня, корпуси з МДФ та фурнітура під щоденне навантаження.",
    category: "furniture",
    materials: ["ясен", "МДФ"],
    style: ["мінімалізм", "теплий сучасний"],
    cover_image: media.kitchenHero,
    images: [media.kitchenHero, media.kitchenDetail],
    price_from: 54000,
    status: "active",
    sort_order: 2,
    is_featured: true,
    seo_title: "Кухня з ясеня на замовлення",
    seo_description: "Індивідуальна кухня з ясеня з розрахунком, виробництвом і монтажем.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "Шафа-гардероб з ясеня Frame",
    slug: "shafa-harderob-yasen-frame",
    description:
      "Вбудована шафа-гардероб з ясеневими фасадами, продуманим зонуванням і прихованою фурнітурою.",
    short_description: "Гардеробна система з ясеня для спальні або передпокою.",
    category: "furniture",
    materials: ["ясен", "МДФ", "скло"],
    style: ["мінімалізм"],
    cover_image: media.wardrobeHero,
    images: [media.wardrobeHero],
    price_from: 36000,
    status: "active",
    sort_order: 3,
    is_featured: false,
    seo_title: "Шафа-гардероб з ясеня",
    seo_description: "Вбудована шафа-гардероб з індивідуальною комплектацією.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "ПВХ-вікно Komfort",
    slug: "vikno-pvh-komfort",
    description:
      "ПВХ-вікно з енергоефективним склопакетом, якісною фурнітурою та професійним монтажем.",
    short_description: "Надійна конфігурація для квартир і будинків з монтажем під ключ.",
    category: "windows",
    materials: ["ПВХ", "скло", "метал"],
    style: ["сучасний"],
    cover_image: media.windowHero,
    images: [media.windowHero, media.windowDetail],
    price_from: 16000,
    status: "active",
    sort_order: 4,
    is_featured: true,
    seo_title: "ПВХ-вікно Komfort",
    seo_description: "ПВХ-вікно з підбором профілю, виготовленням та монтажем.",
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
      address: "вул. Сонячна, 22, Київ, Україна",
      hours: "Пн-Пт: 09:00-18:00",
    },
    description: "Контакти",
    created_at: now,
    updated_at: now,
  },
  {
    key: "seo_home",
    value: {
      title: "Світлиця Майстра — двері, меблі та вікна на замовлення",
      description:
        "Сімейна майстерня, що створює авторські двері, меблі та вікна з акцентом на матеріал, функцію і довговічність.",
    },
    description: "SEO головної",
    created_at: now,
    updated_at: now,
  },
  {
    key: "ai_chat_system_prompt",
    value:
      "Ти цифровий помічник майстерні. Відповідай українською, допомагай підібрати послугу та збирай дані для заявки без вигаданих обіцянок.",
    description: "Prompt для AI чату",
    created_at: now,
    updated_at: now,
  },
];

const blogRows: Row[] = [
  {
    title: "Як вибрати деревину для вхідних дверей",
    slug: "yak-vybraty-derevynu-dlia-vkhidnykh-dverei",
    excerpt: "Порівнюємо дуб, ясен і сосну для різних задач, бюджетів та умов експлуатації.",
    content: [
      "<p>Матеріал дверей впливає не лише на зовнішній вигляд, а й на стабільність геометрії, вагу конструкції та довговічність фінішу.</p>",
      "<p>Для вхідних дверей найчастіше радимо дуб: він добре працює при активному навантаженні, має виразну текстуру та дозволяє робити складні профілі.</p>",
      "<p>Ясен виглядає легше в інтер'єрі, а сосна більше підходить для бюджетних або дачних сценаріїв.</p>",
      "<ul><li>Дуб — для надійності та преміального вигляду.</li><li>Ясен — для легших сучасних рішень.</li><li>Сосна — для економного проєкту.</li></ul>",
    ].join(""),
    cover_image: media.doorHero,
    category: "materials",
    tags: ["двері", "деревина", "дуб"],
    reading_time_min: 4,
    is_published: true,
    published_at: "2026-02-10T10:00:00.000Z",
    seo_title: "Як вибрати деревину для вхідних дверей",
    seo_description: "Практичний гайд по вибору дуба, ясеня чи сосни для дверей на замовлення.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "5 помилок у плануванні кухні на замовлення",
    slug: "5-pomylok-u-planuvanni-kukhni-na-zamovlennia",
    excerpt: "Що варто продумати до старту проєктування, щоб кухня працювала на щодень, а не лише на рендері.",
    content: [
      "<p>Найчастіші проблеми починаються не у виробництві, а на етапі планування сценаріїв користування кухнею.</p>",
      "<p>Недостатньо просто визначити стиль. Важливо розуміти, як ви готуєте, що і де зберігаєте, чи потрібен високий пенал, острів або окрема зона техніки.</p>",
      "<p>Гарна кухня починається з правильних запитань, а не з каталогу фасадів.</p>",
    ].join(""),
    cover_image: media.kitchenHero,
    category: "tips",
    tags: ["кухня", "меблі", "планування"],
    reading_time_min: 5,
    is_published: true,
    published_at: "2026-02-14T11:30:00.000Z",
    seo_title: "5 помилок у плануванні кухні на замовлення",
    seo_description: "Поради, які допоможуть уникнути типових помилок при замовленні кухні.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "Теплий мінімалізм: як поєднати дерево і світлі фасади",
    slug: "teplyi-minimalizm-derevo-i-svitli-fasady",
    excerpt: "Розбираємо прийом, який допомагає зробити меблі сучасними, але не холодними.",
    content: [
      "<p>Теплий мінімалізм працює тоді, коли фактура дерева не змагається з простотою геометрії, а підсилює її.</p>",
      "<p>У практиці це означає менше декоративних елементів, більше уваги до пропорцій, тонів та стику матеріалів.</p>",
      "<p>Ясен і дуб у поєднанні зі світлими площинами створюють інтер'єр, який старіє повільно і не набридає.</p>",
    ].join(""),
    cover_image: media.kitchenDetail,
    category: "design",
    tags: ["дизайн", "ясен", "мінімалізм"],
    reading_time_min: 4,
    is_published: true,
    published_at: "2026-02-18T09:00:00.000Z",
    seo_title: "Теплий мінімалізм у меблях",
    seo_description: "Як поєднати дерево та світлі фасади у сучасному інтер'єрі.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "Кейс: дубові двері для приватного будинку",
    slug: "keis-dubovi-dveri-dlia-pryvatnoho-budynku",
    excerpt: "Що враховували у проєкті, де двері мали бути теплими, важкими та виразними зовні.",
    content: [
      "<p>У цьому кейсі ключовим було поєднати масивність, теплоізоляцію та зовнішню виразність дверного блоку.</p>",
      "<p>Ми посилили конструкцію металевим каркасом, підібрали фурнітуру під вагу полотна та заклали запас під майбутню експлуатацію.</p>",
      "<p>Візуально двері залишилися дуже стриманими, але саме в деталях читається рівень роботи.</p>",
    ].join(""),
    cover_image: media.doorDetail,
    category: "cases",
    tags: ["кейс", "двері", "портфоліо"],
    reading_time_min: 3,
    is_published: true,
    published_at: "2026-02-22T14:00:00.000Z",
    seo_title: "Кейс дубових вхідних дверей",
    seo_description: "Короткий розбір реалізації вхідних дубових дверей для приватного будинку.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "У майстерні запрацювала нова зона фінішного покриття",
    slug: "nova-zona-finishnoho-pokryttia-v-maisterni",
    excerpt: "Пояснюємо, як це скорочує час між шліфуванням, фарбуванням і фінальною перевіркою.",
    content: [
      "<p>Ми оновили внутрішню організацію цеху, щоб пришвидшити фінішні роботи без втрати якості.</p>",
      "<p>Окрема зона дає стабільніший результат по лакуванню, чистіший контроль між етапами та менше ризиків повторної доробки.</p>",
      "<p>Для клієнта це означає більш прогнозований графік і кращий фініш поверхні.</p>",
    ].join(""),
    cover_image: media.workshop,
    category: "news",
    tags: ["майстерня", "новини", "виробництво"],
    reading_time_min: 2,
    is_published: true,
    published_at: "2026-03-01T08:30:00.000Z",
    seo_title: "Нова зона фінішного покриття в майстерні",
    seo_description: "Що змінилося у виробництві та як це впливає на якість готових виробів.",
    created_at: now,
    updated_at: now,
  },
  {
    title: "Чому реставрація дерева інколи цінніша за заміну",
    slug: "chomu-restavratsiia-dereva-tsinnisha-za-zaminu",
    excerpt: "Розповідаємо, коли старі двері чи меблі мають сенс відновлювати, а не виготовляти заново.",
    content: [
      "<p>Не кожен виріб варто списувати після перших втрат фінішу або деформацій.</p>",
      "<p>Якщо основа жива, а предмет має історію, реставрація дозволяє зберегти характер речі та часто виявляється чеснішим рішенням, ніж повна заміна.</p>",
      "<p>Саме тому перед стартом ми завжди робимо діагностику і чесно кажемо, який шлях виправданий.</p>",
    ].join(""),
    cover_image: media.restorationHero,
    category: "culture",
    tags: ["реставрація", "культура", "дерево"],
    reading_time_min: 4,
    is_published: true,
    published_at: "2026-03-05T10:15:00.000Z",
    seo_title: "Коли реставрація дерева краща за заміну",
    seo_description: "Коли старі двері чи меблі краще відновлювати, а не виготовляти заново.",
    created_at: now,
    updated_at: now,
  },
];

const culturalBlogRows: Row[] = [
  {
    title: "Традиція різьблення по дереву в сучасному інтер'єрі",
    slug: "tradytsiia-rizblennia-po-derevu-v-interieri",
    excerpt: "Як ремісничі техніки зберігають актуальність у сучасних дверях та меблях.",
    content:
      "<p>Різьблення не обов'язково має бути музейним. У сучасному інтер'єрі воно працює як тактильний акцент, якщо дотриматися міри.</p><p>Ми часто звертаємося до традиційних мотивів не буквально, а як до джерела пластики, пропорцій і ритму.</p>",
    cover_image: media.workshop,
    category: "culture",
    tags: ["ремесло", "традиція", "дерево"],
    reading_time_min: 5,
    is_published: true,
    published_at: "2026-02-12T12:00:00.000Z",
    seo_title: "Традиція різьблення по дереву",
    seo_description: "Короткий есеїстичний погляд на різьблення по дереву в сучасному просторі.",
    guest_author_name: "Марко Г.",
    guest_author_bio: "Дослідник народного мистецтва та матеріальної культури.",
    allow_comments: true,
    comments_count: 0,
    created_at: now,
    updated_at: now,
  },
  {
    title: "Дерево в архітектурі Карпат: що ми можемо взяти сьогодні",
    slug: "derevo-v-arkhitekturi-karpat-sohodni",
    excerpt: "Текст про пропорції, матеріал і ремісничу логіку, які не втратили актуальності.",
    content:
      "<p>Карпатська архітектура цінна не лише образом, а й тим, як працює з кліматом, масштабом і локальним матеріалом.</p><p>Для сучасного майстра це нагадування: хороший виріб завжди виростає з контексту, а не лише з картинки.</p>",
    cover_image: media.windowDetail,
    category: "heritage",
    tags: ["карпати", "архітектура", "дерево"],
    reading_time_min: 6,
    is_published: true,
    published_at: "2026-02-26T12:00:00.000Z",
    seo_title: "Дерево в архітектурі Карпат",
    seo_description: "Що сучасний майстер може взяти з традицій дерев'яної архітектури Карпат.",
    guest_author_name: null,
    guest_author_bio: null,
    allow_comments: true,
    comments_count: 0,
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
      name: "Ігор Шевчук",
      phone: "+380671112233",
      email: "igor@example.com",
      service_type: "Двері",
      message: "Потрібні вхідні дубові двері з теплим порогом та можливістю вставки скла.",
      source_page: "/products/vkhidni-dveri-z-duba-premium",
      project_ref_id: projectIds.get("vkhidni-dubovi-dveri-kyiv") ?? null,
      status: "new",
      created_at: now,
    },
    {
      id: fixedIds.inquiryKitchen,
      name: "Анна Коваль",
      phone: "+380671112244",
      email: "anna@example.com",
      service_type: "Меблі",
      message: "Цікавить кухня з ясеня та окрема шафа в спальню.",
      source_page: "/services/mebli-na-zamovlennia",
      project_ref_id: projectIds.get("kukhnia-z-yasenia-lviv") ?? null,
      status: "quoted",
      created_at: now,
    },
    {
      id: fixedIds.inquiryWindow,
      name: "Віктор Паламарчук",
      phone: "+380671112255",
      email: "viktor@example.com",
      service_type: "Вікна",
      message: "Потрібен розрахунок двох ПВХ-вікон для тераси з монтажем на 3 поверсі.",
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
              label: "Дубова основа",
              presetKey: "oak_board",
              expression: "width_m * height_m * quantity * 1.15 * preset_value",
              condition: null,
              notes: "Запас на обрізки та технологічний відхід.",
              is_discount: false,
              sort_order: 0,
            },
            {
              id: "72000000-0000-4000-8000-000000000002",
              type: "consumable",
              label: "Лакування",
              presetKey: "varnish_matte",
              expression: "width_m * height_m * quantity * preset_value",
              condition: null,
              notes: "Матовий лак у два шари.",
              is_discount: false,
              sort_order: 1,
            },
            {
              id: "72000000-0000-4000-8000-000000000003",
              type: "material",
              label: "Скління",
              presetKey: "glass_frosted",
              expression: "width_m * height_m * 0.22 * quantity * preset_value",
              condition: "has_glass == true",
              notes: "Додається лише якщо клієнт обрав скління.",
              is_discount: false,
              sort_order: 2,
            },
            {
              id: "72000000-0000-4000-8000-000000000004",
              type: "material",
              label: "Фурнітура",
              presetKey: "hardware_premium",
              expression: "quantity * preset_value",
              condition: null,
              notes: "Преміальний комплект ручки, замка та петель.",
              is_discount: false,
              sort_order: 3,
            },
            {
              id: "72000000-0000-4000-8000-000000000005",
              type: "labor",
              label: "Монтаж",
              presetKey: "install_door",
              expression: "quantity * preset_value",
              condition: null,
              notes: "Встановлення одного дверного блоку.",
              is_discount: false,
              sort_order: 4,
            },
            {
              id: "72000000-0000-4000-8000-000000000006",
              type: "overhead",
              label: "Цехові витрати",
              presetKey: "workshop_day",
              expression: "quantity * 0.5 * preset_value",
              condition: null,
              notes: "Базова частка виробничих накладних.",
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
              label: "Ясеневі фасади",
              presetKey: "ash_board",
              expression: "area_m2 * 1.18 * preset_value",
              condition: null,
              notes: "Фасади та видимі площини.",
              is_discount: false,
              sort_order: 0,
            },
            {
              id: "72000000-0000-4000-8000-000000000008",
              type: "material",
              label: "Корпуси МДФ",
              presetKey: "mdf_16",
              expression: "area_m2 * 0.85 * preset_value",
              condition: null,
              notes: "Корпусні елементи для базової комплектації.",
              is_discount: false,
              sort_order: 1,
            },
            {
              id: "72000000-0000-4000-8000-000000000009",
              type: "consumable",
              label: "Фарбування фасадів",
              presetKey: "paint_white",
              expression: "area_m2 * preset_value",
              condition: "has_paint == true",
              notes: "Додається лише для фарбованих фасадів.",
              is_discount: false,
              sort_order: 2,
            },
            {
              id: "72000000-0000-4000-8000-000000000010",
              type: "material",
              label: "Фурнітура",
              presetKey: "hardware_std",
              expression: "quantity * preset_value",
              condition: null,
              notes: "Напрямні, завіси та базові механізми.",
              is_discount: false,
              sort_order: 3,
            },
            {
              id: "72000000-0000-4000-8000-000000000011",
              type: "labor",
              label: "Робота столяра",
              presetKey: "carpenter_hour",
              expression: "area_m2 * 3.5 * preset_value",
              condition: null,
              notes: "Орієнтовна трудомісткість по фасадах і складанню.",
              is_discount: false,
              sort_order: 4,
            },
            {
              id: "72000000-0000-4000-8000-000000000012",
              type: "margin",
              label: "Знижка на комплект",
              presetKey: null,
              expression: "quantity >= 8 ? 2500 : 0",
              condition: "quantity >= 8",
              notes: "Невелика знижка для великої конфігурації.",
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
              label: "Склопакет",
              presetKey: "glass_frosted",
              expression: "width_m * height_m * quantity * 0.9 * preset_value",
              condition: null,
              notes: "Умовна база для склопакета.",
              is_discount: false,
              sort_order: 0,
            },
            {
              id: "72000000-0000-4000-8000-000000000014",
              type: "labor",
              label: "Монтаж",
              presetKey: "install_window",
              expression: "quantity * preset_value",
              condition: null,
              notes: "Монтаж одного віконного блоку.",
              is_discount: false,
              sort_order: 1,
            },
            {
              id: "72000000-0000-4000-8000-000000000015",
              type: "overhead",
              label: "Логістика",
              presetKey: "delivery_km",
              expression: "20 * preset_value",
              condition: null,
              notes: "Усереднений виїзд по місту та передмістю.",
              is_discount: false,
              sort_order: 2,
            },
            {
              id: "72000000-0000-4000-8000-000000000016",
              type: "overhead",
              label: "Підйом на поверх",
              presetKey: null,
              expression: "(floors - 2) * 250 * quantity",
              condition: "floors > 2",
              notes: "Додається для поверхів вище другого.",
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

  const serviceIds = await fetchIdMap({
    table: "services",
    key: "slug",
    values: serviceRows.map((row) => String(row.slug)),
    label: "service ids",
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
      { project_id: requireId(projectIds, "vkhidni-dubovi-dveri-kyiv", "project"), product_id: requireId(productIds, "vkhidni-dveri-z-duba-premium", "product"), quantity: 1, notes: "Основний дверний блок", sort_order: 0, created_at: now },
      { project_id: requireId(projectIds, "kukhnia-z-yasenia-lviv", "project"), product_id: requireId(productIds, "kukhnia-z-yasenia-linea", "product"), quantity: 1, notes: "Кухонний комплект", sort_order: 0, created_at: now },
      { project_id: requireId(projectIds, "kukhnia-z-yasenia-lviv", "project"), product_id: requireId(productIds, "shafa-harderob-yasen-frame", "product"), quantity: 1, notes: "Додаткова шафа-гардероб", sort_order: 1, created_at: now },
      { project_id: requireId(projectIds, "panoramni-vikna-pvh-dnipro", "project"), product_id: requireId(productIds, "vikno-pvh-komfort", "product"), quantity: 2, notes: "Два однакові віконні блоки", sort_order: 0, created_at: now },
      { project_id: requireId(projectIds, "ofisni-dveri-nda", "project"), product_id: requireId(productIds, "vkhidni-dveri-z-duba-premium", "product"), quantity: 4, notes: "Референсний продукт для NDA-проєкту", sort_order: 0, created_at: now },
    ],
    onConflict: "project_id,product_id",
    label: "project products",
  });

  await upsertRows({ table: "testimonials", rows: testimonialRows(projectIds), onConflict: "id", label: "testimonials" });
  await upsertRows({ table: "site_settings", rows: siteSettingsRows, onConflict: "key", label: "site settings" });

  await upsertCompanyInfo({
    id: fixedIds.companyInfo,
    name: "Світлиця Майстра",
    tagline: "Авторські двері, меблі та вікна з дерева і ПВХ",
    description:
      "Майстерня, що працює на стику ремесла, функції та сучасної архітектури. Ми виготовляємо двері, меблі, вікна та беремося за реставрацію речей, які мають цінність.",
    founded_year: 2015,
    email: "info@svitlytsya.ua",
    phone: "+380 (67) 000-00-00",
    phone_secondary: "+380 (50) 000-00-00",
    address: "вул. Сонячна, 22",
    city: "Київ",
    country: "Україна",
    working_hours: "Пн-Пт 9:00-18:00",
    logo_url: null,
    og_image_url: media.workshop,
    social_facebook: "https://facebook.com/svitlytsya",
    social_instagram: "https://instagram.com/svitlytsya",
    social_youtube: null,
    social_tiktok: null,
    team_members: [
      { id: "team-1", name: "Марина С.", role: "Керівниця проєктів", photo_url: media.teamOne },
      { id: "team-2", name: "Андрій К.", role: "Головний майстер", photo_url: media.teamTwo },
    ],
    certificates: [
      { title: "Гарантія на монтаж", year: 2026 },
      { title: "Внутрішній стандарт якості покриття", year: 2026 },
    ],
    updated_at: now,
  });

  await upsertRows({ table: "blog_posts", rows: blogRows, onConflict: "slug", label: "blog posts" });
  await applyPartialUpdates({
    table: "blog_posts",
    key: "slug",
    label: "blog post rich fields",
    optional: true,
    rows: [
      { slug: "yak-vybraty-derevynu-dlia-vkhidnykh-dverei", author_name: "Команда Світлиці", author_avatar: null, is_featured: true, views_count: 184, likes_count: 16, related_service_id: serviceIds.get("dveri-na-zamovlennia") ?? null, related_product_id: productIds.get("vkhidni-dveri-z-duba-premium") ?? null },
      { slug: "5-pomylok-u-planuvanni-kukhni-na-zamovlennia", author_name: "Марина С.", author_avatar: media.teamOne, is_featured: true, views_count: 211, likes_count: 24, related_service_id: serviceIds.get("mebli-na-zamovlennia") ?? null, related_product_id: productIds.get("kukhnia-z-yasenia-linea") ?? null },
      { slug: "teplyi-minimalizm-derevo-i-svitli-fasady", author_name: "Команда Світлиці", author_avatar: null, is_featured: false, views_count: 127, likes_count: 11, related_service_id: serviceIds.get("mebli-na-zamovlennia") ?? null, related_product_id: productIds.get("shafa-harderob-yasen-frame") ?? null },
      { slug: "keis-dubovi-dveri-dlia-pryvatnoho-budynku", author_name: "Андрій К.", author_avatar: media.teamTwo, is_featured: false, views_count: 98, likes_count: 9, related_service_id: serviceIds.get("dveri-na-zamovlennia") ?? null, related_product_id: productIds.get("vkhidni-dveri-z-duba-premium") ?? null },
      { slug: "nova-zona-finishnoho-pokryttia-v-maisterni", author_name: "Команда Світлиці", author_avatar: null, is_featured: false, views_count: 65, likes_count: 4, related_service_id: serviceIds.get("restavratsiia-derevianykh-vyrobiv") ?? null, related_product_id: null },
      { slug: "chomu-restavratsiia-dereva-tsinnisha-za-zaminu", author_name: "Команда Світлиці", author_avatar: null, is_featured: false, views_count: 89, likes_count: 8, related_service_id: serviceIds.get("restavratsiia-derevianykh-vyrobiv") ?? null, related_product_id: null },
    ],
  });

  await upsertRows({
    table: "cultural_blog_posts",
    rows: culturalBlogRows,
    onConflict: "slug",
    label: "cultural blog posts",
    optional: true,
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
        { id: fixedIds.aiMessageDoor1, chat_session_id: doorSessionId, role: "user", content: "Потрібні вхідні двері з дуба. Чи можна приблизно порахувати вартість?", tokens_used: 18, created_at: now },
        { id: fixedIds.aiMessageDoor2, chat_session_id: doorSessionId, role: "assistant", content: "Так, для орієнтиру потрібні розміри, кількість і чи буде скління. Після цього ми зможемо дати попередній розрахунок.", tokens_used: 32, created_at: now },
        { id: fixedIds.aiMessageDoor3, chat_session_id: doorSessionId, role: "user", content: "Розмір 0.9 на 2.1, одні двері, матове скло потрібне.", tokens_used: 16, created_at: now },
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
    table: "product_configurations",
    rows: [
      { configuration_key: "entry_oak_glass_modern_090x210", product_type: "door", parameters: { material: "oak", glass: true, style: "modern", width_m: 0.9, height_m: 2.1 }, image_url: media.doorHero, is_active: true, created_at: now, updated_at: now },
      { configuration_key: "kitchen_ash_painted_7m2", product_type: "furniture", parameters: { material: "ash", paint: true, area_m2: 7, modules: 8 }, image_url: media.kitchenHero, is_active: true, created_at: now, updated_at: now },
      { configuration_key: "window_pvc_180x150_install", product_type: "window", parameters: { profile: "pvc", width_m: 1.8, height_m: 1.5, quantity: 2, installation: true }, image_url: media.windowHero, is_active: true, created_at: now, updated_at: now },
    ],
    onConflict: "configuration_key",
    label: "product configurations",
    optional: true,
  });

  await upsertRows({
    table: "orders",
    rows: [
      { order_number: "SM-2026-001", inquiry_id: fixedIds.inquiryDoor, user_id: null, status: "production", expected_date: "2026-04-10", actual_date: null, internal_notes: "Клієнт просить тихий замок і матове скло.", priority: "urgent", created_at: now, updated_at: now },
      { order_number: "SM-2026-002", inquiry_id: fixedIds.inquiryKitchen, user_id: null, status: "design", expected_date: "2026-04-24", actual_date: null, internal_notes: "Потрібно узгодити наповнення пенала та острів.", priority: "normal", created_at: now, updated_at: now },
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
        { id: fixedIds.orderItem1, order_id: orderOneId, product_id: requireId(productIds, "vkhidni-dveri-z-duba-premium", "product"), quantity: 1, unit_price: 38750, notes: "Дубові вхідні двері зі склом", sort_order: 0, created_at: now },
      ],
    });

    await replaceScopedRows({
      table: "order_status_history",
      scopeKey: "order_id",
      scopeValue: orderOneId,
      label: "order history SM-2026-001",
      optional: true,
      rows: [
        { id: fixedIds.orderHistory1, order_id: orderOneId, from_status: null, to_status: "new", comment: "Замовлення створено з заявки.", is_visible_to_client: true, created_by: null, created_at: now },
        { id: fixedIds.orderHistory2, order_id: orderOneId, from_status: "new", to_status: "consulting", comment: "Погоджуємо матеріал, скління та фурнітуру.", is_visible_to_client: true, created_by: null, created_at: now },
        { id: fixedIds.orderHistory3, order_id: orderOneId, from_status: "consulting", to_status: "production", comment: "Запущено в цех після затвердження креслень.", is_visible_to_client: true, created_by: null, created_at: now },
      ],
    });

    await replaceScopedRows({
      table: "order_messages",
      scopeKey: "order_id",
      scopeValue: orderOneId,
      label: "order messages SM-2026-001",
      optional: true,
      rows: [
        { id: fixedIds.orderMessage1, order_id: orderOneId, sender_type: "admin", sender_id: null, content: "Креслення погоджено, запускаємо двері у виробництво.", attachment_url: null, is_read: true, created_at: now },
        { id: fixedIds.orderMessage2, order_id: orderOneId, sender_type: "client", sender_id: null, content: "Підтверджую матове скло й темний фініш.", attachment_url: null, is_read: true, created_at: now },
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
        { id: fixedIds.orderItem2, order_id: orderTwoId, product_id: requireId(productIds, "kukhnia-z-yasenia-linea", "product"), quantity: 1, unit_price: 68500, notes: "Основна кухня з островом", sort_order: 0, created_at: now },
        { id: fixedIds.orderItem3, order_id: orderTwoId, product_id: requireId(productIds, "shafa-harderob-yasen-frame", "product"), quantity: 1, unit_price: 39200, notes: "Окрема шафа-гардероб", sort_order: 1, created_at: now },
      ],
    });

    await replaceScopedRows({
      table: "order_status_history",
      scopeKey: "order_id",
      scopeValue: orderTwoId,
      label: "order history SM-2026-002",
      optional: true,
      rows: [
        { id: fixedIds.orderHistory4, order_id: orderTwoId, from_status: null, to_status: "new", comment: "Отримали запит від клієнта.", is_visible_to_client: true, created_by: null, created_at: now },
        { id: fixedIds.orderHistory5, order_id: orderTwoId, from_status: "new", to_status: "design", comment: "Готуємо планування кухні та схему наповнення.", is_visible_to_client: true, created_by: null, created_at: now },
      ],
    });

    await replaceScopedRows({
      table: "order_messages",
      scopeKey: "order_id",
      scopeValue: orderTwoId,
      label: "order messages SM-2026-002",
      optional: true,
      rows: [
        { id: fixedIds.orderMessage3, order_id: orderTwoId, sender_type: "admin", sender_id: null, content: "Підготували перший варіант планування кухні та шафи, чекаємо на коментарі.", attachment_url: null, is_read: false, created_at: now },
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