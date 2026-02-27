import type { Inquiry, Project, Service, SiteSetting, Testimonial } from "@/lib/types";

const now = new Date().toISOString();

export const mockProjects: Project[] = [
  {
    id: "a7f2bd7d-2eca-4f09-a2c4-95b30c3f0631",
    title: "Вхідні дубові двері для приватного будинку",
    slug: "dubovi-vkhidni-dveri-kyiv",
    description:
      "Комплексний проєкт вхідної групи з масиву дуба. У фокусі були теплоізоляція, тиша та стримана класика фасаду.",
    category: "doors",
    style: ["класика", "модерн"],
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
      "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600585154206-1f7f84f0f2fb?auto=format&fit=crop&w=1400&q=80",
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "b6ef381f-25be-4ef0-a724-a2f91f7d9532",
    title: "Кухня з натурального ясеня",
    slug: "kitchen-yasen-lviv",
    description:
      "Кухонний комплект під простір квартири з акцентом на ергономіку робочої зони та приховану фурнітуру.",
    category: "furniture",
    style: ["мінімалізм", "скандинавський"],
    materials: ["ясен", "скло"],
    dimensions: "Л-подібна, 3.8 м + 2.1 м",
    location: "Львів",
    completed_at: "2025-09-03",
    duration_days: 31,
    status: "public",
    is_featured: true,
    cover_image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1400&q=80",
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "39e3f124-b4df-43a6-bdfe-d9680899c411",
    title: "Панорамні ПВХ вікна для вітальні",
    slug: "panoramni-pvh-vikna-dnipro",
    description:
      "Встановлення енергоефективних віконних систем із багатокамерним профілем і шумоізоляцією.",
    category: "windows",
    style: ["мінімалізм"],
    materials: ["ПВХ", "скло"],
    dimensions: "2400 x 2100 мм (2 секції)",
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
    id: "911f664a-d11a-4ec1-af3d-a52a415306f3",
    title: "Реставрація антикварної міжкімнатної пари",
    slug: "restavratsiia-antykvarnykh-dverei-odesa",
    description:
      "Очищення, відновлення геометрії, тонування та фінішне покриття без втрати історичного характеру.",
    category: "doors",
    style: ["класика"],
    materials: ["дуб"],
    dimensions: "2 полотна 820 x 2050 мм",
    location: "Одеса",
    completed_at: "2025-05-13",
    duration_days: 18,
    status: "concept",
    is_featured: false,
    cover_image:
      "https://images.unsplash.com/photo-1503174971373-b1f69850bded?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1503174971373-b1f69850bded?auto=format&fit=crop&w=1400&q=80",
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "28e1269c-69fb-4ea8-867d-6ce63e8f9193",
    title: "Шафа-гардероб у ніші",
    slug: "shafa-garderob-kharkiv",
    description:
      "Індивідуальна система зберігання з підсвіткою та розсувною системою.",
    category: "furniture",
    style: ["лофт", "мінімалізм"],
    materials: ["сосна", "метал"],
    dimensions: "3000 x 2600 x 600 мм",
    location: "Харків",
    completed_at: "2025-03-28",
    duration_days: 16,
    status: "public",
    is_featured: true,
    cover_image:
      "https://images.unsplash.com/photo-1616594039964-3ad6f5f1f5f5?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1616594039964-3ad6f5f1f5f5?auto=format&fit=crop&w=1400&q=80",
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "58aa3f77-c57a-41e4-9112-4d48c8bd3bc8",
    title: "Дверний блок для офісу (NDA)",
    slug: "dvernyi-blok-nda",
    description:
      "Проєкт для комерційного замовника з підвищеними вимогами до приватності та безпеки.",
    category: "doors",
    style: ["модерн"],
    materials: ["метал", "дуб"],
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

export const mockServices: Service[] = [
  {
    id: "d05670fb-3ef8-4afb-8d87-04ef613f7062",
    title: "Двері на замовлення",
    slug: "dveri-na-zamovlennia",
    short_description: "Вхідні та міжкімнатні двері під ваш проєкт і стиль.",
    description:
      "Проєктуємо та виготовляємо двері з акцентом на надійність, шумоізоляцію та естетику. Кожне рішення підбираємо під конкретний об'єкт: приватний будинок, квартира чи комерційне приміщення.",
    process_steps: [
      "Запит та попередня консультація",
      "Замір і технічне завдання",
      "Підбір матеріалів і ескіз",
      "Виробництво",
      "Монтаж і гарантійний супровід",
    ],
    cover_image:
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1200&q=80",
    sort_order: 1,
  },
  {
    id: "f736f793-1da3-46eb-b16e-0ee8f228d3f0",
    title: "Меблі на замовлення",
    slug: "mebli-na-zamovlennia",
    short_description: "Кухні, шафи, гардероби, корпусні рішення під простір.",
    description:
      "Розробляємо меблі, які працюють на щоденний комфорт. Враховуємо сценарії використання, освітлення та ергономіку, щоб результат був практичним і довговічним.",
    process_steps: [
      "Бриф та обміри",
      "Планування наповнення",
      "Візуалізація та узгодження",
      "Виробництво",
      "Доставка, монтаж, фінальна перевірка",
    ],
    cover_image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    sort_order: 2,
  },
  {
    id: "338ff218-8f79-4f2f-950f-c7736f4320ff",
    title: "Вікна ПВХ",
    slug: "vikna-pvh",
    short_description: "Енергоефективні вікна з професійним монтажем.",
    description:
      "Підбираємо профілі та склопакети під умови об'єкта і бюджет. Основний фокус: тепло, тиша, герметичність та акуратне встановлення.",
    process_steps: [
      "Огляд об'єкта",
      "Підбір конфігурації",
      "Виготовлення",
      "Монтаж і регулювання",
      "Гарантійне обслуговування",
    ],
    cover_image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    sort_order: 3,
  },
  {
    id: "a811714f-bb14-4f1b-a87b-a8d0ec4f0a3f",
    title: "Реставрація",
    slug: "restavratsiia",
    short_description: "Делікатне відновлення дерев'яних виробів та фурнітури.",
    description:
      "Працюємо з історичними та цінними виробами: знімаємо старі покриття, відновлюємо структуру деревини, підбираємо тон та захист. Всі етапи погоджуємо з клієнтом.",
    process_steps: [
      "Оцінка стану",
      "Тестове відновлення зразка",
      "Основна реставрація",
      "Фінішне покриття",
      "Передача та рекомендації з догляду",
    ],
    cover_image:
      "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?auto=format&fit=crop&w=1200&q=80",
    sort_order: 4,
  },
];

export const mockTestimonials: Testimonial[] = [
  {
    id: "1f421325-d6e7-4518-a73d-6c6496655f85",
    author_name: "Олена К.",
    author_location: "Київ",
    content:
      "Замовляли вхідні двері. Майстер детально пояснив матеріали, терміни і все зробили в узгоджений час. Якість відмінна.",
    rating: 5,
    project_id: mockProjects[0]?.id ?? null,
    is_visible: true,
    created_at: now,
  },
  {
    id: "0bcf03d0-79ba-4ec0-991a-b3bb7f00f76e",
    author_name: "Сергій М.",
    author_location: "Львів",
    content:
      "Кухню зробили точно під нішу і наші звички. Результат виглядає дорого і дуже зручно в побуті.",
    rating: 5,
    project_id: mockProjects[1]?.id ?? null,
    is_visible: true,
    created_at: now,
  },
  {
    id: "8148bf29-7578-4929-a36a-bf6a2b1938fa",
    author_name: "Ірина П.",
    author_location: "Дніпро",
    content:
      "Після заміни вікон стало значно тихіше в квартирі. Монтаж акуратний, майстри ввічливі.",
    rating: 4,
    project_id: mockProjects[2]?.id ?? null,
    is_visible: true,
    created_at: now,
  },
];

export const mockInquiries: Inquiry[] = [
  {
    id: "4f8be2f0-df92-425d-a693-6345cc6b1499",
    name: "Тарас",
    phone: "+380671112233",
    email: "taras@example.com",
    service_type: "Двері",
    message: "Потрібні вхідні двері для будинку, цікавить дуб.",
    source_page: "/catalog/dubovi-vkhidni-dveri-kyiv",
    project_ref_id: mockProjects[0]?.id ?? null,
    configuration: null,
    chat_session_id: null,
    status: "new",
    created_at: now,
  },
];

export const mockSiteSettings: SiteSetting[] = [
  {
    key: "contacts",
    value: {
      phone: "+380 (67) 000-00-00",
      email: "info@svitlytsya.ua",
      address: "Україна, м. Київ, вул. Майстерна, 12",
      hours: "Пн-Пт: 09:00-18:00",
    },
    description: "Контактні дані компанії",
  },
  {
    key: "seo_home",
    value: {
      title: "Svitlytsya Maystra — Двері, меблі та вікна під ключ",
      description:
        "Сімейна майстерня з досвідом 26+ років. Виготовляємо двері, меблі, вікна та реставруємо вироби з гарантією якості.",
      ogImage:
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80",
    },
    description: "SEO дані головної сторінки",
  },
];

