import type { Inquiry, Service, SiteSetting, Testimonial } from "@/lib/types";

const now = new Date().toISOString();

export const mockServices: Service[] = [
  {
    id: "d05670fb-3ef8-4afb-8d87-04ef613f7062",
    title: "Двері на замовлення",
    slug: "dveri-na-zamovlennia",
    tagline: "Рішення під ваш простір і розмір",
    short_description: "Вхідні та міжкімнатні двері під ваш проєкт.",
    description: "Повний цикл: консультація, замір, виробництво, монтаж.",
    icon: "🚪",
    category: "production",
    features: [
      { title: "Індивідуальні розміри", description: "Підганяємо конструкцію під ваш проєкт." },
      { title: "Натуральні матеріали", description: "Працюємо з перевіреним масивом дерева." },
    ],
    process_steps: [
      { step: 1, title: "Консультація", description: "Обговорюємо задачу та стилістику." },
      { step: 2, title: "Замір", description: "Фіксуємо точні параметри на об'єкті." },
      { step: 3, title: "Виробництво", description: "Готуємо виріб у майстерні." },
      { step: 4, title: "Монтаж", description: "Встановлюємо та перевіряємо результат." },
    ],
    cover_image:
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1200&q=80",
    gallery: [],
    price_from: null,
    price_unit: "грн",
    duration_days_from: null,
    duration_days_to: null,
    is_active: true,
    is_featured: true,
    seo_title: null,
    seo_description: null,
    sort_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: "f736f793-1da3-46eb-b16e-0ee8f228d3f0",
    title: "Меблі на замовлення",
    slug: "mebli-na-zamovlennia",
    tagline: "Функціональні меблі без шаблонів",
    short_description: "Кухні, шафи, корпусні рішення.",
    description: "Проєктування і виготовлення меблів під ваш простір.",
    icon: "🪑",
    category: "production",
    features: [
      { title: "Точне проектування", description: "Плануємо під сценарії використання." },
      { title: "Виробництво під нішу", description: "Максимально використовуємо простір." },
    ],
    process_steps: [
      { step: 1, title: "Бриф", description: "Збираємо вимоги та референси." },
      { step: 2, title: "Проєкт", description: "Готуємо креслення та погодження." },
      { step: 3, title: "Виготовлення", description: "Запускаємо виробництво деталей." },
      { step: 4, title: "Монтаж", description: "Збираємо меблі на місці." },
    ],
    cover_image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    gallery: [],
    price_from: null,
    price_unit: "грн",
    duration_days_from: null,
    duration_days_to: null,
    is_active: true,
    is_featured: false,
    seo_title: null,
    seo_description: null,
    sort_order: 2,
    created_at: now,
    updated_at: now,
  },
];

export const mockTestimonials: Testimonial[] = [
  {
    id: "1f421325-d6e7-4518-a73d-6c6496655f85",
    author_name: "Олена К.",
    author_location: "Київ",
    content: "Роботу виконали якісно і вчасно.",
    rating: 5,
    project_id: null,
    is_visible: true,
    created_at: now,
  },
  {
    id: "0bcf03d0-79ba-4ec0-991a-b3bb7f00f76e",
    author_name: "Сергій М.",
    author_location: "Львів",
    content: "Зручні меблі та чітка комунікація на всіх етапах.",
    rating: 5,
    project_id: null,
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
    source_page: "/products",
    configuration: null,
    chat_session_id: null,
    channel: "web_form",
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
      address: "Україна, м. Київ",
      hours: "Пн-Пт: 09:00-18:00",
    },
    description: "Контактні дані компанії",
  },
];
