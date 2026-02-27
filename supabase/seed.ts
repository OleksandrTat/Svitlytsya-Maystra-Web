import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const now = new Date().toISOString();

const projects = [
  {
    title: "Вхідні дубові двері",
    slug: "vkhidni-dubovi-dveri",
    description: "Дверний блок з масиву дуба для приватного будинку.",
    category: "doors",
    style: ["класика"],
    materials: ["дуб", "метал"],
    dimensions: "1100 x 2300 мм",
    location: "Київ",
    completed_at: "2025-11-17",
    duration_days: 24,
    status: "public",
    is_featured: true,
    cover_image: "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1400&q=80"],
  },
  {
    title: "Кухня з ясеня",
    slug: "kukhnia-z-yasenia",
    description: "Кухонний комплект для квартири.",
    category: "furniture",
    style: ["мінімалізм"],
    materials: ["ясен", "скло"],
    dimensions: "3.8м + 2.1м",
    location: "Львів",
    completed_at: "2025-09-03",
    duration_days: 31,
    status: "public",
    is_featured: true,
    cover_image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80"],
  },
  {
    title: "Панорамні ПВХ вікна",
    slug: "panoramni-pvh-vikna",
    description: "Енергоефективні вікна з монтажем.",
    category: "windows",
    style: ["мінімалізм"],
    materials: ["ПВХ", "скло"],
    dimensions: "2400 x 2100 мм",
    location: "Дніпро",
    completed_at: "2025-07-21",
    duration_days: 12,
    status: "public",
    is_featured: true,
    cover_image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80"],
  },
  {
    title: "Шафа-гардероб в нішу",
    slug: "shafa-garderob-nisha",
    description: "Система зберігання з підсвіткою.",
    category: "furniture",
    style: ["лофт"],
    materials: ["сосна", "метал"],
    dimensions: "3000 x 2600 x 600 мм",
    location: "Харків",
    completed_at: "2025-03-28",
    duration_days: 16,
    status: "public",
    is_featured: true,
    cover_image: "https://images.unsplash.com/photo-1616594039964-3ad6f5f1f5f5?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1616594039964-3ad6f5f1f5f5?auto=format&fit=crop&w=1400&q=80"],
  },
  {
    title: "Реставрація антикварних дверей",
    slug: "restavratsiia-antykvarnykh-dverei",
    description: "Відновлення геометрії та покриття.",
    category: "doors",
    style: ["класика"],
    materials: ["дуб"],
    dimensions: "820 x 2050 мм",
    location: "Одеса",
    completed_at: "2025-05-13",
    duration_days: 18,
    status: "concept",
    is_featured: false,
    cover_image: "https://images.unsplash.com/photo-1503174971373-b1f69850bded?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1503174971373-b1f69850bded?auto=format&fit=crop&w=1400&q=80"],
  },
  {
    title: "Офісні двері NDA",
    slug: "ofisni-dveri-nda",
    description: "Комерційний проєкт з обмеженням публічності.",
    category: "doors",
    style: ["модерн"],
    materials: ["метал", "дуб"],
    dimensions: "1200 x 2400 мм",
    location: "Київ",
    completed_at: "2024-12-11",
    duration_days: 21,
    status: "nda",
    is_featured: false,
    cover_image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80"],
  },
  {
    title: "Комплект дитячої кімнати",
    slug: "komplekt-dytiachoi-kimnaty",
    description: "Меблі під індивідуальний простір кімнати.",
    category: "furniture",
    style: ["скандинавський"],
    materials: ["сосна", "фарба"],
    dimensions: "Індивідуально",
    location: "Івано-Франківськ",
    completed_at: "2025-01-22",
    duration_days: 19,
    status: "public",
    is_featured: false,
    cover_image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1400&q=80"],
  },
  {
    title: "ПВХ вікна для котеджу",
    slug: "pvh-vikna-dlia-kotedzhu",
    description: "Монтаж віконної системи з трикамерним профілем.",
    category: "windows",
    style: ["модерн"],
    materials: ["ПВХ", "скло"],
    dimensions: "Серія отворів",
    location: "Буча",
    completed_at: "2025-02-13",
    duration_days: 10,
    status: "public",
    is_featured: false,
    cover_image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80"],
  },
  {
    title: "Міжкімнатні двері з шпонуванням",
    slug: "mizhkimnatni-dveri-shpon",
    description: "Комплект дверей у стилі мінімалізм.",
    category: "doors",
    style: ["мінімалізм"],
    materials: ["шпон", "МДФ"],
    dimensions: "800 x 2100 мм",
    location: "Черкаси",
    completed_at: "2025-06-05",
    duration_days: 14,
    status: "public",
    is_featured: false,
    cover_image: "https://images.unsplash.com/photo-1464890100898-a385f744067f?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1464890100898-a385f744067f?auto=format&fit=crop&w=1400&q=80"],
  },
  {
    title: "Реставрація дерев'яних вікон",
    slug: "restavratsiia-derevianykh-vikon",
    description: "Реставрація історичних рам з лакофарбовим покриттям.",
    category: "windows",
    style: ["класика"],
    materials: ["дуб", "скло"],
    dimensions: "Індивідуально",
    location: "Луцьк",
    completed_at: "2025-04-02",
    duration_days: 11,
    status: "concept",
    is_featured: false,
    cover_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80"],
  },
].map((item) => ({ ...item, created_at: now, updated_at: now }));

const services = [
  {
    title: "Двері на замовлення",
    slug: "dveri-na-zamovlennia",
    short_description: "Вхідні та міжкімнатні двері під ваш проєкт.",
    description: "Індивідуальне виготовлення дверей з фокусом на надійність і шумоізоляцію.",
    process_steps: [
      "Запит і консультація",
      "Замір",
      "Проєктування",
      "Виробництво",
      "Монтаж",
      "Гарантія",
    ],
    cover_image: "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1200&q=80",
    sort_order: 1,
  },
  {
    title: "Меблі на замовлення",
    slug: "mebli-na-zamovlennia",
    short_description: "Кухні, шафи, гардероби під простір.",
    description: "Функціональні корпусні меблі за індивідуальними параметрами.",
    process_steps: ["Запит", "Обміри", "Проєкт", "Виготовлення", "Монтаж"],
    cover_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    sort_order: 2,
  },
  {
    title: "Вікна ПВХ",
    slug: "vikna-pvh",
    short_description: "Енергоефективні віконні системи.",
    description: "Підбір профілю, виготовлення й професійний монтаж ПВХ вікон.",
    process_steps: ["Огляд", "Підбір", "Виготовлення", "Монтаж", "Сервіс"],
    cover_image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    sort_order: 3,
  },
  {
    title: "Реставрація",
    slug: "restavratsiia",
    short_description: "Відновлення дерев'яних виробів.",
    description: "Делікатна реставрація антикварних та сучасних виробів з дерева.",
    process_steps: ["Оцінка", "Тест", "Реставрація", "Фініш"],
    cover_image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?auto=format&fit=crop&w=1200&q=80",
    sort_order: 4,
  },
].map((item) => ({ ...item, created_at: now, updated_at: now }));

const testimonials = [
  {
    id: "98f71f5f-8318-4dd8-a451-c4cfd24e9401",
    author_name: "Олена К.",
    author_location: "Київ",
    content: "Замовляли двері. Все виконано якісно і вчасно.",
    rating: 5,
    is_visible: true,
  },
  {
    id: "387c6313-f740-4ac6-87d7-88b4163e29fa",
    author_name: "Сергій М.",
    author_location: "Львів",
    content: "Кухня вийшла дуже зручною в щоденному використанні.",
    rating: 5,
    is_visible: true,
  },
  {
    id: "37fab81e-f433-428d-9118-d2211f9f7d10",
    author_name: "Ірина П.",
    author_location: "Дніпро",
    content: "Після монтажу вікон стало тихо і тепло.",
    rating: 4,
    is_visible: true,
  },
  {
    id: "647dc4ea-f3c9-4af2-a7ba-5ad4f4f76ed2",
    author_name: "Юрій Л.",
    author_location: "Одеса",
    content: "Реставрація пройшла делікатно, результатом задоволені.",
    rating: 5,
    is_visible: true,
  },
  {
    id: "f4bc9ac4-a6e0-4cf9-a560-c9dc2e81f5d8",
    author_name: "Марина С.",
    author_location: "Харків",
    content: "Професійний підхід і акуратний монтаж.",
    rating: 5,
    is_visible: true,
  },
].map((item) => ({ ...item, created_at: now }));

const siteSettings = [
  {
    key: "contacts",
    value: {
      phone: "+380 (67) 000-00-00",
      email: "info@svitlytsya.ua",
      address: "Україна, м. Київ, вул. Майстерна, 12",
      hours: "Пн-Пт: 09:00-18:00",
    },
    description: "Контактні дані",
  },
  {
    key: "seo_home",
    value: {
      title: "Svitlytsya Maystra — Двері, меблі, вікна",
      description: "Сімейна майстерня з 26+ роками досвіду.",
      ogImage: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80",
    },
    description: "SEO головної",
  },
  {
    key: "socials",
    value: {
      instagram: "https://instagram.com/svitlytsya.maystra",
      facebook: "https://facebook.com/svitlytsya.maystra",
    },
    description: "Соціальні мережі",
  },
].map((item) => ({ ...item, created_at: now, updated_at: now }));

async function run() {
  console.log("Seeding projects...");
  const { error: projectsError } = await supabase
    .from("projects")
    .upsert(projects, { onConflict: "slug" });
  if (projectsError) throw projectsError;

  console.log("Seeding services...");
  const { error: servicesError } = await supabase
    .from("services")
    .upsert(services, { onConflict: "slug" });
  if (servicesError) throw servicesError;

  console.log("Seeding testimonials...");
  const { error: testimonialsError } = await supabase
    .from("testimonials")
    .upsert(testimonials, { onConflict: "id" });
  if (testimonialsError) throw testimonialsError;

  console.log("Seeding site settings...");
  const { error: settingsError } = await supabase
    .from("site_settings")
    .upsert(siteSettings, { onConflict: "key" });
  if (settingsError) throw settingsError;

  console.log("Seed completed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
