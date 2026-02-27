import type { Inquiry, Project, Service, SiteSetting, Testimonial } from "@/lib/types";

const now = new Date().toISOString();

export const mockProjects: Project[] = [
  {
    id: "a7f2bd7d-2eca-4f09-a2c4-95b30c3f0631",
    title: "Вхідні дубові двері",
    slug: "vkhidni-dubovi-dveri",
    description: "Індивідуальний проєкт вхідних дверей із масиву дуба.",
    category: "doors",
    style: ["класика"],
    materials: ["дуб", "метал"],
    dimensions: "1100 x 2300 мм",
    location: "Київ",
    completed_at: "2025-11-17",
    duration_days: 24,
    status: "public",
    privacy_level: "public",
    is_featured: true,
    cover_image:
      "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1400&q=80",
    ],
    blurred_images: [],
    private_client_name: null,
    private_location: null,
    private_notes: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: "b6ef381f-25be-4ef0-a724-a2f91f7d9532",
    title: "Кухня з ясеня",
    slug: "kukhnya-z-yasenya",
    description: "Кухонний комплект із натурального дерева під індивідуальні розміри.",
    category: "furniture",
    style: ["мінімалізм"],
    materials: ["ясен", "скло"],
    dimensions: "3.8 м + 2.1 м",
    location: "Львів",
    completed_at: "2025-09-03",
    duration_days: 31,
    status: "public",
    privacy_level: "public",
    is_featured: true,
    cover_image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
    ],
    blurred_images: [],
    private_client_name: null,
    private_location: null,
    private_notes: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: "58aa3f77-c57a-41e4-9112-4d48c8bd3bc8",
    title: "Конфіденційний дверний блок",
    slug: "konfidentsiyniy-dverniy-blok",
    description: "Проєкт під NDA, публічно доступний лише у знеособленому вигляді.",
    category: "doors",
    style: ["модерн"],
    materials: ["дуб", "метал"],
    dimensions: "1200 x 2400 мм",
    location: null,
    completed_at: "2024-12-11",
    duration_days: 21,
    status: "nda",
    privacy_level: "nda_partial",
    is_featured: false,
    cover_image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
    ],
    blurred_images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=20&blur=400",
    ],
    private_client_name: "Private Client",
    private_location: "Kyiv region",
    private_notes: "Internal NDA record",
    created_at: now,
    updated_at: now,
  },
];

export const mockServices: Service[] = [
  {
    id: "d05670fb-3ef8-4afb-8d87-04ef613f7062",
    title: "Двері на замовлення",
    slug: "dveri-na-zamovlennia",
    short_description: "Вхідні та міжкімнатні двері під ваш проєкт.",
    description: "Повний цикл: консультація, замір, виробництво, монтаж.",
    process_steps: ["Консультація", "Замір", "Виробництво", "Монтаж"],
    cover_image:
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1200&q=80",
    sort_order: 1,
  },
  {
    id: "f736f793-1da3-46eb-b16e-0ee8f228d3f0",
    title: "Меблі на замовлення",
    slug: "mebli-na-zamovlennia",
    short_description: "Кухні, шафи, корпусні рішення.",
    description: "Проєктування і виготовлення меблів під ваш простір.",
    process_steps: ["Бриф", "Проєкт", "Виготовлення", "Монтаж"],
    cover_image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    sort_order: 2,
  },
];

export const mockTestimonials: Testimonial[] = [
  {
    id: "1f421325-d6e7-4518-a73d-6c6496655f85",
    author_name: "Олена К.",
    author_location: "Київ",
    content: "Роботу виконали якісно і вчасно.",
    rating: 5,
    project_id: mockProjects[0]?.id ?? null,
    is_visible: true,
    created_at: now,
  },
  {
    id: "0bcf03d0-79ba-4ec0-991a-b3bb7f00f76e",
    author_name: "Сергій М.",
    author_location: "Львів",
    content: "Зручні меблі та чітка комунікація на всіх етапах.",
    rating: 5,
    project_id: mockProjects[1]?.id ?? null,
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
    source_page: "/catalog/vkhidni-dubovi-dveri",
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
      address: "Україна, м. Київ",
      hours: "Пн-Пт: 09:00-18:00",
    },
    description: "Контактні дані компанії",
  },
  {
    key: "ai_chat_system_prompt",
    value:
      "You are Mykola, digital assistant of Svitlytsya Maystra. Reply in Ukrainian or user language, never in Russian.",
    description: "System prompt for AI chat",
  },
];