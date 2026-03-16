import { cache } from "react";
import { unstable_cache } from "next/cache";
import { mockInquiries, mockProjects, mockServices, mockSiteSettings, mockTestimonials } from "@/lib/data/mock";
import type {
  ActivityLog,
  AuditLogRecord,
  AIChatMessage,
  AIChatSession,
  CatalogFilters,
  FormulaComponent,
  Invoice,
  Inquiry,
  Payment,
  Order,
  OrderMessage,
  OrderStatusHistory,
  PriceFormula,
  PricePreset,
  Product,
  ProductStatus,
  Project,
  Service,
  SiteSetting,
  SupportChat,
  SupportMessage,
  Testimonial,
} from "@/lib/types";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { DEFAULT_CHAT_SYSTEM_PROMPT } from "@/lib/chat/constants";
import {
  parseAdminNotificationSettings,
  parseOrderTemplates,
  type AdminNotificationSettingsPayload,
  type OrderTemplate,
} from "@/lib/admin/config";
import type { Database } from "@/lib/types/database";

function splitCsvParam(value?: string) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export function parseCatalogFilters(searchParams: Record<string, string | string[] | undefined>): CatalogFilters {
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const styles = splitCsvParam(typeof searchParams.style === "string" ? searchParams.style : undefined);
  const materials = splitCsvParam(typeof searchParams.material === "string" ? searchParams.material : undefined);
  const page = Number(typeof searchParams.page === "string" ? searchParams.page : "1") || 1;

  return {
    category: category as CatalogFilters["category"],
    status: status as CatalogFilters["status"],
    styles,
    materials,
    page: page > 0 ? page : 1,
    pageSize: 9,
  };
}

// ── PRODUCTS ──────────────────────────────────────────────

export type ProductFilters = {
  category?: string;
  materials: string[];
  styles: string[];
  status?: ProductStatus;
  featured?: boolean;
  page: number;
  pageSize: number;
};

export function parseProductFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ProductFilters {
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const styles = splitCsvParam(typeof searchParams.style === "string" ? searchParams.style : undefined);
  const materials = splitCsvParam(typeof searchParams.material === "string" ? searchParams.material : undefined);
  const featuredValue = typeof searchParams.featured === "string" ? searchParams.featured : undefined;
  const featured =
    featuredValue === "true" || featuredValue === "1" || featuredValue === "yes";
  const page = Number(typeof searchParams.page === "string" ? searchParams.page : "1") || 1;

  return {
    category,
    status: status as ProductStatus | undefined,
    styles,
    materials,
    featured: featured || undefined,
    page: page > 0 ? page : 1,
    pageSize: 9,
  };
}

function applyCatalogFilters(items: Project[], filters: CatalogFilters) {
  return items.filter((project) => {
    if (filters.category && project.category !== filters.category) {
      return false;
    }

    if (filters.status && project.status !== filters.status) {
      return false;
    }

    if (filters.styles.length > 0) {
      const hasStyle = filters.styles.every((style) => project.style.includes(style));
      if (!hasStyle) {
        return false;
      }
    }

    if (filters.materials.length > 0) {
      const hasMaterial = filters.materials.every((material) => project.materials.includes(material));
      if (!hasMaterial) {
        return false;
      }
    }

    return true;
  });
}

function parseServiceSteps(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item : ""))
    .filter(Boolean);
}

function normalizeSlugValue(value: string) {
  const trimmed = value.trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function extractStringSetting(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "prompt" in value &&
    typeof value.prompt === "string"
  ) {
    return value.prompt;
  }

  return null;
}

function mapService(row: Database["public"]["Tables"]["services"]["Row"]): Service {
  return {
    ...row,
    process_steps: parseServiceSteps(row.process_steps),
  };
}

export const getFeaturedProjects = cache(async (limit = 6): Promise<Project[]> => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockProjects
      .filter((project) => project.is_featured)
      .slice(0, limit);
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_featured", true)
    .neq("status", "concept")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return mockProjects
      .filter((project) => project.is_featured)
      .slice(0, limit);
  }

  return data;
});

export const getVisibleTestimonials = cache(async (limit = 3): Promise<Testimonial[]> => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockTestimonials.filter((item) => item.is_visible).slice(0, limit);
  }

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return mockTestimonials.filter((item) => item.is_visible).slice(0, limit);
  }

  return data;
});

export async function getCatalogProjects(
  filters: CatalogFilters,
): Promise<{ items: Project[]; total: number }> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const filtered = applyCatalogFilters(mockProjects, filters);
    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;

    return {
      items: filtered.slice(start, end),
      total: filtered.length,
    };
  }

  let query = supabase
    .from("projects")
    .select("*", { count: "exact" })
    .neq("status", "concept")
    .order("completed_at", { ascending: false });

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.styles.length > 0) {
    query = query.contains("style", filters.styles);
  }

  if (filters.materials.length > 0) {
    query = query.contains("materials", filters.materials);
  }

  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize - 1;

  const { data, count, error } = await query.range(start, end);

  if (error || !data) {
    const filtered = applyCatalogFilters(
      mockProjects.filter((item) => item.status !== "concept"),
      filters,
    );

    return {
      items: filtered.slice(start, start + filters.pageSize),
      total: filtered.length,
    };
  }

  return {
    items: data,
    total: count ?? data.length,
  };
}

export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const normalizedSlug = normalizeSlugValue(slug);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      mockProjects.find(
        (project) => project.slug === normalizedSlug || project.slug.toLowerCase() === normalizedSlug.toLowerCase(),
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (!error && data) {
    return data;
  }

  const { data: caseInsensitiveData, error: caseInsensitiveError } = await supabase
    .from("projects")
    .select("*")
    .ilike("slug", normalizedSlug)
    .maybeSingle();

  if (!caseInsensitiveError && caseInsensitiveData) {
    return caseInsensitiveData;
  }

  return (
    mockProjects.find(
      (project) => project.slug === normalizedSlug || project.slug.toLowerCase() === normalizedSlug.toLowerCase(),
    ) ?? null
  );
});

export async function getRelatedProjects(project: Project, limit = 4): Promise<Project[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockProjects
      .filter((item) => item.category === project.category && item.slug !== project.slug && item.status !== "concept")
      .slice(0, limit);
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("category", project.category)
    .neq("slug", project.slug)
    .neq("status", "concept")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return mockProjects
      .filter((item) => item.category === project.category && item.slug !== project.slug && item.status !== "concept")
      .slice(0, limit);
  }

  return data;
}

export const getAllPublicProjectSlugs = cache(async () => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockProjects
      .filter((project) => project.status !== "concept")
      .map((project) => project.slug);
  }

  const { data, error } = await supabase
    .from("projects")
    .select("slug")
    .neq("status", "concept");

  if (error || !data) {
    return mockProjects
      .filter((project) => project.status !== "concept")
      .map((project) => project.slug);
  }

  return data.map((project) => project.slug);
});

export async function getProducts(
  filters: ProductFilters,
): Promise<{ items: Product[]; total: number }> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return { items: [], total: 0 };
  }

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.materials.length > 0) {
    query = query.contains("materials", filters.materials);
  }

  if (filters.styles.length > 0) {
    query = query.contains("style", filters.styles);
  }

  if (filters.featured) {
    query = query.eq("is_featured", true);
  }

  const start = (filters.page - 1) * filters.pageSize;
  const { data, count, error } = await query.range(start, start + filters.pageSize - 1);

  if (error || !data) {
    return { items: [], total: 0 };
  }

  return { items: data as Product[], total: count ?? data.length };
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Product;
});

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(limit);

  return (data ?? []) as Product[];
}

export async function getAllProductsForAdmin(): Promise<Product[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  return (data ?? []) as Product[];
}

export async function getProductsForProject(projectId: string): Promise<Product[]> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("project_products")
    .select("product_id, sort_order, quantity, notes, products(*)")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  type ProjectProductRow = {
    product_id: string;
    sort_order: number;
    quantity: number;
    notes: string | null;
    products: Database["public"]["Tables"]["products"]["Row"] | null;
  };

  const rows = (data ?? []) as unknown as ProjectProductRow[];

  return rows
    .map((row) => row.products)
    .filter((product): product is Database["public"]["Tables"]["products"]["Row"] => product !== null)
    .map((product) => product as Product);
}

export async function getProjectsForProduct(productId: string): Promise<Project[]> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("project_products")
    .select("project_id, sort_order, quantity, notes, projects(*)")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  type ProductProjectRow = {
    project_id: string;
    sort_order: number;
    quantity: number;
    notes: string | null;
    projects: Database["public"]["Tables"]["projects"]["Row"] | null;
  };

  const rows = (data ?? []) as unknown as ProductProjectRow[];

  return rows
    .map((row) => row.projects)
    .filter(
      (project): project is Database["public"]["Tables"]["projects"]["Row"] =>
        project !== null && project.status !== "concept",
    )
    .map((project) => project as Project);
}

export async function getPriceFormulaById(formulaId: string): Promise<PriceFormula | null> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase || !formulaId) {
    return null;
  }

  const { data, error } = await supabase
    .from("price_formulas")
    .select("*")
    .eq("id", formulaId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PriceFormula;
}

export async function getPricePresetsForFormula(formulaId: string): Promise<PricePreset[]> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase || !formulaId) {
    return [];
  }

  const { data: components, error: componentsError } = await supabase
    .from("formula_components")
    .select("preset_id")
    .eq("formula_id", formulaId);

  if (componentsError || !components) {
    return [];
  }

  const presetIds = Array.from(
    new Set(components.map((component) => component.preset_id).filter(Boolean)),
  ) as string[];

  if (presetIds.length === 0) {
    return [];
  }

  const { data } = await supabase
    .from("price_presets")
    .select("*")
    .in("id", presetIds);

  return (data ?? []) as PricePreset[];
}

export const getServices = cache(async (): Promise<Service[]> => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [...mockServices].sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [...mockServices].sort((a, b) => a.sort_order - b.sort_order);
  }

  return data.map(mapService);
});

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockServices.find((service) => service.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return mockServices.find((service) => service.slug === slug) ?? null;
  }

  return mapService(data);
});

export async function getDashboardStats() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalProjects: mockProjects.length,
      totalInquiries: mockInquiries.length,
      newInquiriesToday: mockInquiries.filter((item) => item.created_at.startsWith(today)).length,
    };
  }

  const [projectsResult, inquiriesResult, inquiriesTodayResult] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date().toISOString().slice(0, 10)),
  ]);

  return {
    totalProjects: projectsResult.count ?? 0,
    totalInquiries: inquiriesResult.count ?? 0,
    newInquiriesToday: inquiriesTodayResult.count ?? 0,
  };
}

export const getAdminWorkspaceCounts = unstable_cache(
  async () => {
    const supabase = await getSupabaseForAdminQueries();
    if (!supabase) {
      return { unreadMessages: 0, newInquiries: 0, unreadSupport: 0 };
    }

    const [messagesResult, inquiriesResult, supportResult] = await Promise.all([
      supabase
        .from("order_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_type", "client")
        .eq("is_read", false),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase
        .from("support_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_type", "client")
        .eq("is_read", false),
    ]);

    return {
      unreadMessages: messagesResult.count ?? 0,
      newInquiries: inquiriesResult.count ?? 0,
      unreadSupport: supportResult.count ?? 0,
    };
  },
  ["admin-workspace-counts"],
  {
    revalidate: 30,
    tags: ["admin-counts"],
  },
);

export async function getRecentInquiries(limit = 5): Promise<Inquiry[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockInquiries.slice(0, limit);
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return mockInquiries.slice(0, limit);
  }

  return data;
}

export async function getAllProjectsForAdmin(): Promise<Project[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [...mockProjects];
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [...mockProjects];
  }

  return data;
}

export async function getAllServicesForAdmin(): Promise<Service[]> {
  const services = await getServices();
  return services;
}

export async function getAllTestimonialsForAdmin(): Promise<Testimonial[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [...mockTestimonials];
  }

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [...mockTestimonials];
  }

  return data;
}

export async function getAllInquiriesForAdmin(): Promise<Inquiry[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [...mockInquiries];
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [...mockInquiries];
  }

  return data;
}

export async function getSiteSettingsForAdmin(): Promise<SiteSetting[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [...mockSiteSettings];
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error || !data) {
    return [...mockSiteSettings];
  }

  return data;
}

export async function getChatSystemPrompt(): Promise<string> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());

  let basePrompt = DEFAULT_CHAT_SYSTEM_PROMPT;

  if (supabase) {
    const [settingResult, productsResult] = await Promise.all([
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ai_chat_system_prompt")
        .maybeSingle(),
      supabase
        .from("products")
        .select("title, category, description, price_from, materials")
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .limit(20),
    ]);

    const customPrompt = extractStringSetting(settingResult.data?.value);
    if (customPrompt) {
      basePrompt = customPrompt;
    }

    const products = productsResult.data ?? [];
    if (products.length > 0) {
      const productList = products
        .map(
          (product) =>
            `- ${product.title} (${product.category})${
              product.price_from ? `, від ${product.price_from} грн` : ""
            }${product.materials?.length ? `, матеріали: ${product.materials.join(", ")}` : ""}`,
        )
        .join("\n");

      basePrompt += `\n\nАктуальний асортимент майстерні:\n${productList}\n\nКоли клієнт питає про продукти — посилайся на ці позиції.`;
    }
  }

  return basePrompt;
}

export async function getContactSettings() {
  const settings = await getSiteSettingsForAdmin();
  const contacts = settings.find((setting) => setting.key === "contacts")?.value;

  if (
    contacts &&
    typeof contacts === "object" &&
    !Array.isArray(contacts) &&
    "phone" in contacts &&
    "email" in contacts
  ) {
    return contacts as {
      phone: string;
      email: string;
      address: string;
      hours: string;
    };
  }

  return {
    phone: "+380 (67) 000-00-00",
    email: "info@svitlytsya.ua",
    address: "Вул. Сонячна, 22, Слобідка, Тернопільська область, Україна, 47632",
    hours: "Пн-Пт: 09:00-18:00",
  };
}


export async function getActivityLogsForAdmin(limit = 100): Promise<ActivityLog[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as ActivityLog[];
}

export async function getChatSessionsForAdmin(limit = 100): Promise<AIChatSession[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("ai_chat_sessions")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as AIChatSession[];
}

export async function getChatMessagesForAdmin(chatSessionId: string, limit = 100): Promise<AIChatMessage[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("*")
    .eq("chat_session_id", chatSessionId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as AIChatMessage[];
}

// ── SUPPORT CHAT ──────────────────────────────────────────

export async function getOrCreateSupportChat(
  userId: string,
  subject?: string,
  orderId?: string,
): Promise<SupportChat | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data: existing } = await supabase
    .from("support_chats")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["open", "waiting"])
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing as SupportChat;
  }

  const { data: created, error } = await supabase
    .from("support_chats")
    .insert({
      user_id: userId,
      order_id: orderId ?? null,
      subject: subject ?? null,
      channel: "internal",
      status: "open",
    })
    .select("*")
    .single();

  if (error || !created) {
    return null;
  }

  return created as SupportChat;
}

export async function getSupportChatMessages(
  chatId: string,
  userId: string,
): Promise<SupportMessage[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data: chat } = await supabase
    .from("support_chats")
    .select("id")
    .eq("id", chatId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!chat) {
    return [];
  }

  const { data } = await supabase
    .from("support_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(200);

  const writeClient = createSupabaseServiceClient() ?? supabase;

  await writeClient
    .from("support_messages")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .eq("is_read", false)
    .neq("sender_type", "client");

  return (data ?? []) as SupportMessage[];
}

export async function getSupportChatsForAdmin(
  limit = 100,
): Promise<(SupportChat & { user_display_name: string | null; unread_count: number })[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return [];
  }

  const { data: chats } = await supabase
    .from("support_chats")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (!chats || chats.length === 0) {
    return [];
  }

  const userIds = [...new Set(chats.map((chat) => chat.user_id))];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));

  const chatIds = chats.map((chat) => chat.id);
  const { data: unreadData } = await supabase
    .from("support_messages")
    .select("chat_id")
    .in("chat_id", chatIds)
    .eq("sender_type", "client")
    .eq("is_read", false);

  const unreadMap = new Map<string, number>();
  for (const row of unreadData ?? []) {
    unreadMap.set(row.chat_id, (unreadMap.get(row.chat_id) ?? 0) + 1);
  }

  return chats.map((chat) => ({
    ...(chat as SupportChat),
    user_display_name: profileMap.get(chat.user_id) ?? null,
    unread_count: unreadMap.get(chat.id) ?? 0,
  }));
}

export async function getSupportChatMessagesForAdmin(chatId: string): Promise<SupportMessage[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("support_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(200);

  await supabase
    .from("support_messages")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .eq("sender_type", "client")
    .eq("is_read", false);

  return (data ?? []) as SupportMessage[];
}
export type ClientSummary = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  account_types: string[];
  created_at: string;
  last_seen_at: string;
  orders_count: number;
};

async function getSupabaseForAdminQueries() {
  return createSupabaseServiceClient() ?? (await createSupabaseServerClient());
}

export async function getClientOrders(
  userId: string,
  filter: "active" | "completed" | "all" = "active",
): Promise<Order[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !userId) {
    return [];
  }

  let query = supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filter === "active") {
    query = query.not("status", "in", "(completed,archived)");
  }

  if (filter === "completed") {
    query = query.eq("status", "completed");
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data as Order[];
}

export async function getClientOrderById(orderId: string, userId: string): Promise<Order | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !orderId || !userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Order;
}

export async function getClientOrderTimeline(
  orderId: string,
  userId: string,
): Promise<OrderStatusHistory[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !orderId || !userId) {
    return [];
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!order) {
    return [];
  }

  const { data, error } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", orderId)
    .eq("is_visible_to_client", true)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as OrderStatusHistory[];
}

export async function getClientOrderMessages(orderId: string, userId: string): Promise<OrderMessage[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !orderId || !userId) {
    return [];
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!order) {
    return [];
  }

  const { data, error } = await supabase
    .from("order_messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
    .limit(300);

  if (error || !data) {
    return [];
  }

  return data as OrderMessage[];
}

export async function getClientUnreadOrderNotificationsCount(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !userId) {
    return 0;
  }

  const { count } = await supabase
    .from("order_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return count ?? 0;
}

export async function getOrdersForAdmin(limit = 200): Promise<Order[]> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as Order[];
}

export async function getOrderByIdForAdmin(orderId: string): Promise<Order | null> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase || !orderId) {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Order;
}

export async function getOrderTimelineForAdmin(orderId: string): Promise<OrderStatusHistory[]> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase || !orderId) {
    return [];
  }

  const { data, error } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as OrderStatusHistory[];
}

export async function getOrderMessagesByOrderForAdmin(orderId: string): Promise<OrderMessage[]> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase || !orderId) {
    return [];
  }

  const { data, error } = await supabase
    .from("order_messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
    .limit(300);

  if (error || !data) {
    return [];
  }

  return data as OrderMessage[];
}

// ── INVOICES & PAYMENTS ───────────────────────────────────

export async function getInvoicesByOrderForAdmin(orderId: string): Promise<Invoice[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Invoice[];
}

export async function getPaymentsByOrderForAdmin(orderId: string): Promise<Payment[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("paid_at", { ascending: false });

  return (data ?? []) as Payment[];
}

export async function getInvoicesByOrderForClient(
  orderId: string,
  userId: string,
): Promise<Invoice[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!order) {
    return [];
  }

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Invoice[];
}

// ── REVENUE & FINANCE ─────────────────────────────────────

export type RevenueStats = {
  totalInvoiced: number;
  totalPaid: number;
  totalOverdue: number;
  totalDraft: number;
  overdueCount: number;
  pendingCount: number;
};

export async function getRevenueStatsForAdmin(): Promise<RevenueStats> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOverdue: 0,
      totalDraft: 0,
      overdueCount: 0,
      pendingCount: 0,
    };
  }

  const { data } = await supabase
    .from("invoices")
    .select("total, paid_amount, status");

  const rows = data ?? [];

  return {
    totalInvoiced: rows
      .filter((row) => row.status !== "cancelled")
      .reduce((sum, row) => sum + Number(row.total), 0),
    totalPaid: rows
      .filter((row) => row.status === "paid")
      .reduce((sum, row) => sum + Number(row.total), 0),
    totalOverdue: rows
      .filter((row) => row.status === "overdue")
      .reduce((sum, row) => sum + (Number(row.total) - Number(row.paid_amount)), 0),
    totalDraft: rows
      .filter((row) => row.status === "draft")
      .reduce((sum, row) => sum + Number(row.total), 0),
    overdueCount: rows.filter((row) => row.status === "overdue").length,
    pendingCount: rows.filter((row) => row.status === "sent" || row.status === "partial").length,
  };
}

export type PaymentTimelinePoint = {
  month: string;
  invoiced: number;
  paid: number;
  overdue: number;
};

export async function getPaymentTimeline(months = 12): Promise<PaymentTimelinePoint[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return [];
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

  const [invoicesResult, paymentsResult] = await Promise.all([
    supabase
      .from("invoices")
      .select("total, status, issued_at")
      .gte("issued_at", start.toISOString()),
    supabase
      .from("payments")
      .select("amount, paid_at")
      .gte("paid_at", start.toISOString()),
  ]);

  const invoices = invoicesResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  const result: PaymentTimelinePoint[] = [];
  for (let i = 0; i < months; i += 1) {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("uk-UA", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(date);

    const monthInvoiced = invoices
      .filter((invoice) => invoice.issued_at.startsWith(key) && invoice.status !== "cancelled")
      .reduce((sum, invoice) => sum + Number(invoice.total), 0);

    const monthPaid = payments
      .filter((payment) => payment.paid_at.startsWith(key))
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const monthOverdue = invoices
      .filter((invoice) => invoice.issued_at.startsWith(key) && invoice.status === "overdue")
      .reduce((sum, invoice) => sum + Number(invoice.total), 0);

    result.push({
      month: label,
      invoiced: Math.round(monthInvoiced),
      paid: Math.round(monthPaid),
      overdue: Math.round(monthOverdue),
    });
  }

  return result;
}

export type InvoiceWithOrder = {
  id: string;
  invoice_number: string;
  order_id: string;
  order_number: string;
  client_name: string;
  total: number;
  paid_amount: number;
  status: string;
  due_date: string | null;
  issued_at: string;
};

export async function getAllInvoicesForAdmin(limit = 200): Promise<InvoiceWithOrder[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return [];
  }

  const [{ data: invoices }, { data: orders }, { data: inquiries }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .order("issued_at", { ascending: false })
      .limit(limit),
    supabase.from("orders").select("id, order_number, inquiry_id, user_id"),
    supabase.from("inquiries").select("id, name"),
  ]);

  const orderMap = new Map((orders ?? []).map((order) => [order.id, order]));
  const inquiryMap = new Map((inquiries ?? []).map((inquiry) => [inquiry.id, inquiry]));

  return (invoices ?? []).map((invoice) => {
    const order = orderMap.get(invoice.order_id);
    const inquiry = order?.inquiry_id ? inquiryMap.get(order.inquiry_id) : null;

    return {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      order_id: invoice.order_id,
      order_number: order?.order_number ?? "-",
      client_name: inquiry?.name ?? "Клієнт",
      total: Number(invoice.total),
      paid_amount: Number(invoice.paid_amount),
      status: invoice.status,
      due_date: invoice.due_date,
      issued_at: invoice.issued_at,
    };
  });
}

export async function getOverdueInvoicesForAdmin(): Promise<InvoiceWithOrder[]> {
  const all = await getAllInvoicesForAdmin();
  return all.filter((invoice) => invoice.status === "overdue" || invoice.status === "partial");
}

export async function getAvgDaysToPayment(): Promise<number> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return 0;
  }

  const { data } = await supabase
    .from("payments")
    .select("paid_at, order_id")
    .order("paid_at", { ascending: false })
    .limit(100);

  if (!data || data.length === 0) {
    return 0;
  }

  const orderIds = [...new Set(data.map((payment) => payment.order_id))];
  const { data: orders } = await supabase
    .from("orders")
    .select("id, inquiry_id, created_at")
    .in("id", orderIds);

  const orderMap = new Map((orders ?? []).map((order) => [order.id, order]));

  const diffs = data
    .map((payment) => {
      const order = orderMap.get(payment.order_id);
      if (!order) {
        return null;
      }
      const start = new Date(order.created_at).getTime();
      const end = new Date(payment.paid_at).getTime();
      return Math.round((end - start) / (1000 * 60 * 60 * 24));
    })
    .filter((diff): diff is number => diff !== null && diff >= 0);

  if (diffs.length === 0) {
    return 0;
  }

  return Math.round(diffs.reduce((sum, value) => sum + value, 0) / diffs.length);
}

export async function getPricePresetsForAdmin(): Promise<PricePreset[]> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("price_presets")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as PricePreset[];
}

export async function getPriceFormulasForAdmin(): Promise<PriceFormula[]> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("price_formulas")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as PriceFormula[];
}

export async function getFormulaComponentsForAdmin(formulaId: string): Promise<FormulaComponent[]> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase || !formulaId) {
    return [];
  }

  const { data, error } = await supabase
    .from("formula_components")
    .select("*")
    .eq("formula_id", formulaId)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as FormulaComponent[];
}

export async function getClientsForAdmin(limit = 200): Promise<ClientSummary[]> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase) {
    return [];
  }

  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("id, display_name, avatar_url, account_types, created_at, last_seen_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase.from("orders").select("user_id"),
    ]);

  if (profilesError || !profiles || ordersError || !orders) {
    return [];
  }

  const orderCountMap = new Map<string, number>();
  for (const order of orders) {
    if (!order.user_id) {
      continue;
    }
    orderCountMap.set(order.user_id, (orderCountMap.get(order.user_id) ?? 0) + 1);
  }

  return profiles.map((profile) => ({
    ...profile,
    orders_count: orderCountMap.get(profile.id) ?? 0,
  })) as ClientSummary[];
}

export async function getAuditLogForAdmin(limit = 500): Promise<AuditLogRecord[]> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as AuditLogRecord[];
}

export type AnalyticsRevenuePoint = {
  month: string;
  revenue: number;
  orders: number;
};

export type AnalyticsServicePoint = {
  name: string;
  value: number;
};

export type AnalyticsTopClient = {
  userId: string;
  displayName: string;
  orders: number;
  revenue: number;
};

export type AdminAnalyticsData = {
  revenue: AnalyticsRevenuePoint[];
  services: AnalyticsServicePoint[];
  topClients: AnalyticsTopClient[];
  summary: {
    completedOrders: number;
    totalOrders: number;
    inquiries: number;
    conversionRate: number;
    averageCheck: number;
    openFunnels: number;
  };
};

export type FunnelStep = {
  label: string;
  count: number;
  percent: number;
};

export type AdminAnalyticsDataV2 = AdminAnalyticsData & {
  paymentTimeline: PaymentTimelinePoint[];
  revenueStats: RevenueStats;
  funnel: FunnelStep[];
  avgDaysToPayment: number;
  repeatClientsCount: number;
  topProducts: { name: string; count: number; revenue: number }[];
  productionLoad: { week: string; active: number; load: number }[];
};

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export async function getAdminAnalyticsData(months = 12): Promise<AdminAnalyticsData> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase) {
    return {
      revenue: [],
      services: [],
      topClients: [],
      summary: {
        completedOrders: 0,
        totalOrders: 0,
        inquiries: 0,
        conversionRate: 0,
        averageCheck: 0,
        openFunnels: 0,
      },
    };
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const startIso = start.toISOString();

  const [ordersResult, inquiriesResult, calculationsResult, profilesResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, user_id, status, created_at, inquiry_id")
      .gte("created_at", startIso)
      .order("created_at", { ascending: true }),
    supabase
      .from("inquiries")
      .select("id, service_type, status, created_at")
      .gte("created_at", startIso)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_calculations")
      .select("order_id, total, created_at")
      .gte("created_at", startIso)
      .order("created_at", { ascending: false }),
    supabase.from("user_profiles").select("id, display_name"),
  ]);

  const orders = ordersResult.data ?? [];
  const inquiries = inquiriesResult.data ?? [];
  const calculations = calculationsResult.data ?? [];
  const profiles = profilesResult.data ?? [];

  const monthsList: { key: string; label: string }[] = [];
  for (let index = 0; index < months; index += 1) {
    const date = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1),
    );
    monthsList.push({ key: monthKey(date), label: monthLabel(date) });
  }

  const revenueByMonth = new Map<string, { revenue: number; orders: number }>();
  for (const month of monthsList) {
    revenueByMonth.set(month.key, { revenue: 0, orders: 0 });
  }

  const inquiryMap = new Map(inquiries.map((inquiry) => [inquiry.id, inquiry]));

  const latestCalculationByOrder = new Map<string, number>();
  for (const row of calculations) {
    if (!latestCalculationByOrder.has(row.order_id)) {
      latestCalculationByOrder.set(row.order_id, Number(row.total) || 0);
    }
  }

  const serviceCounter = new Map<string, number>();
  let completedOrders = 0;
  let revenueTotal = 0;

  for (const order of orders) {
    if (order.status !== "completed") {
      continue;
    }

    completedOrders += 1;
    const orderDate = new Date(order.created_at);
    const key = monthKey(orderDate);
    const current = revenueByMonth.get(key);
    const orderRevenue = latestCalculationByOrder.get(order.id) ?? 0;

    if (current) {
      current.revenue += orderRevenue;
      current.orders += 1;
    }

    revenueTotal += orderRevenue;

    const serviceName = order.inquiry_id
      ? inquiryMap.get(order.inquiry_id)?.service_type ?? "Інше"
      : "Інше";
    serviceCounter.set(serviceName, (serviceCounter.get(serviceName) ?? 0) + 1);
  }

  const orderInquiryIds = new Set(
    orders
      .filter((order) => Boolean(order.inquiry_id))
      .map((order) => order.inquiry_id as string),
  );

  const openFunnels = inquiries.filter(
    (inquiry) =>
      inquiry.status !== "done" &&
      inquiry.status !== "archived" &&
      !orderInquiryIds.has(inquiry.id),
  ).length;

  const conversionRate =
    inquiries.length > 0 ? Math.round((orders.length / inquiries.length) * 1000) / 10 : 0;
  const averageCheck = completedOrders > 0 ? Math.round(revenueTotal / completedOrders) : 0;

  const profileNameMap = new Map(
    profiles.map((profile) => [profile.id, profile.display_name ?? "Клієнт"]),
  );
  const topClientMap = new Map<string, { orders: number; revenue: number }>();

  for (const order of orders) {
    if (!order.user_id || order.status !== "completed") {
      continue;
    }

    const current = topClientMap.get(order.user_id) ?? { orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += latestCalculationByOrder.get(order.id) ?? 0;
    topClientMap.set(order.user_id, current);
  }

  const topClients: AnalyticsTopClient[] = [...topClientMap.entries()]
    .map(([userId, value]) => ({
      userId,
      displayName: profileNameMap.get(userId) ?? "Клієнт",
      orders: value.orders,
      revenue: value.revenue,
    }))
    .sort((left, right) => {
      if (right.orders === left.orders) {
        return right.revenue - left.revenue;
      }
      return right.orders - left.orders;
    })
    .slice(0, 5);

  return {
    revenue: monthsList.map((month) => {
      const value = revenueByMonth.get(month.key) ?? { revenue: 0, orders: 0 };
      return {
        month: month.label,
        revenue: Math.round(value.revenue),
        orders: value.orders,
      };
    }),
    services: [...serviceCounter.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value),
    topClients,
    summary: {
      completedOrders,
      totalOrders: orders.length,
      inquiries: inquiries.length,
      conversionRate,
      averageCheck,
      openFunnels,
    },
  };
}

export async function getAdminAnalyticsDataV2(months = 12): Promise<AdminAnalyticsDataV2> {
  const supabase = await getSupabaseForAdminQueries();

  const [base, paymentTimeline, revenueStats, avgDays] = await Promise.all([
    getAdminAnalyticsData(months),
    getPaymentTimeline(months),
    getRevenueStatsForAdmin(),
    getAvgDaysToPayment(),
  ]);

  const totalInquiries = base.summary.inquiries;
  const totalOrders = base.summary.totalOrders;

  let invoicesCount = 0;
  let paidCount = 0;

  if (supabase) {
    const [{ count: invoiceCount }, { count: paidInvoiceCount }] = await Promise.all([
      supabase.from("invoices").select("id", { count: "exact", head: true }),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid"),
    ]);

    invoicesCount = invoiceCount ?? 0;
    paidCount = paidInvoiceCount ?? 0;
  }

  const funnel: FunnelStep[] = [
    { label: "Заявки", count: totalInquiries, percent: 100 },
    {
      label: "Замовлення",
      count: totalOrders,
      percent: totalInquiries > 0 ? Math.round((totalOrders / totalInquiries) * 100) : 0,
    },
    {
      label: "Рахунки",
      count: invoicesCount,
      percent: totalOrders > 0 ? Math.round((invoicesCount / totalOrders) * 100) : 0,
    },
    {
      label: "Оплачено",
      count: paidCount,
      percent: invoicesCount > 0 ? Math.round((paidCount / invoicesCount) * 100) : 0,
    },
  ];

  let repeatClientsCount = 0;
  if (supabase) {
    const { data: ordersByUser } = await supabase
      .from("orders")
      .select("user_id")
      .not("user_id", "is", null);

    const userOrderCount = new Map<string, number>();
    for (const row of ordersByUser ?? []) {
      if (!row.user_id) {
        continue;
      }
      userOrderCount.set(row.user_id, (userOrderCount.get(row.user_id) ?? 0) + 1);
    }

    repeatClientsCount = [...userOrderCount.values()].filter((count) => count > 1).length;
  }

  let topProducts: { name: string; count: number; revenue: number }[] = [];
  if (supabase) {
    const { data: orderProducts } = await supabase
      .from("orders")
      .select("product_id, products(title)")
      .not("product_id", "is", null);

    const productCount = new Map<string, { name: string; count: number; revenue: number }>();
    for (const row of orderProducts ?? []) {
      if (!row.product_id) {
        continue;
      }
      const name = (row.products as { title?: string } | null)?.title ?? "Невідомо";
      const existing = productCount.get(row.product_id) ?? { name, count: 0, revenue: 0 };
      existing.count += 1;
      productCount.set(row.product_id, existing);
    }

    topProducts = [...productCount.values()]
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  }

  let productionLoad: { week: string; active: number; load: number }[] = [];
  if (supabase) {
    const { data: activeOrders } = await supabase
      .from("orders")
      .select("created_at, expected_date, status")
      .not("status", "in", "(completed,archived)");

    const now = new Date();
    productionLoad = Array.from({ length: 8 }, (_, index) => {
      const weekStart = new Date(now.getTime() - (7 - index) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const label = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`;

      const active = (activeOrders ?? []).filter((order) => {
        const start = new Date(order.created_at);
        const end = order.expected_date
          ? new Date(order.expected_date)
          : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
        return start <= weekEnd && end >= weekStart;
      }).length;

      return {
        week: label,
        active,
        load: Math.min(100, Math.round((active / 10) * 100)),
      };
    });
  }

  return {
    ...base,
    summary: {
      ...base.summary,
      averageCheck:
        paidCount > 0 ? Math.round(revenueStats.totalPaid / paidCount) : base.summary.averageCheck,
    },
    paymentTimeline,
    revenueStats,
    funnel,
    avgDaysToPayment: avgDays,
    repeatClientsCount,
    topProducts,
    productionLoad,
  };
}

export async function getOrderTemplatesForAdmin(): Promise<OrderTemplate[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return parseOrderTemplates(null);
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "order_templates")
    .maybeSingle();

  if (error) {
    return parseOrderTemplates(null);
  }

  return parseOrderTemplates(data?.value ?? null);
}

export async function getAdminNotificationSettingsForAdmin(): Promise<AdminNotificationSettingsPayload> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) {
    return parseAdminNotificationSettings(null);
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "admin_notification_settings")
    .maybeSingle();

  if (error) {
    return parseAdminNotificationSettings(null);
  }

  return parseAdminNotificationSettings(data?.value ?? null);
}


