import { cache } from "react";
import { unstable_cache } from "next/cache";
import { mockInquiries, mockServices, mockSiteSettings, mockTestimonials } from "@/lib/data/mock";
import type {
  ActivityLog,
  AuditLogRecord,
  AIChatMessage,
  AIChatSession,
  CompanyInfo,
  CompanyTeamMember,
  FormulaComponent,
  Inquiry,
  Order,
  OrderMessage,
  OrderStatusHistory,
  PriceFormula,
  PricePreset,
  Product,
  ProductStatus,
  Service,
  ServiceFeature,
  ServiceProcessStep,
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
import { extractPricingIdentifiers } from "@/lib/pricing/expression";
import type { Database } from "@/lib/types/database";

function splitCsvParam(value?: string) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
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

function parseServiceFeatures(value: unknown): ServiceFeature[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return {
          title: item,
          description: "",
        };
      }

      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const feature = item as Record<string, unknown>;
      const title = typeof feature.title === "string" ? feature.title.trim() : "";
      const description =
        typeof feature.description === "string" ? feature.description.trim() : "";

      if (!title) {
        return null;
      }

      return {
        title,
        description,
      };
    })
    .filter((item): item is ServiceFeature => item !== null);
}

function parseServiceSteps(value: unknown): ServiceProcessStep[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (typeof item === "string") {
        const title = item.trim();
        if (!title) {
          return null;
        }

        return {
          step: index + 1,
          title,
          description: "",
        };
      }

      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const step = item as Record<string, unknown>;
      const title = typeof step.title === "string" ? step.title.trim() : "";
      const description = typeof step.description === "string" ? step.description.trim() : "";
      const parsedStep =
        typeof step.step === "number" && Number.isFinite(step.step) ? Math.round(step.step) : index + 1;

      if (!title) {
        return null;
      }

      return {
        step: parsedStep,
        title,
        description,
      };
    })
    .filter((item): item is ServiceProcessStep => item !== null)
    .sort((left, right) => left.step - right.step)
    .map((item, index) => ({
      ...item,
      step: index + 1,
    }));
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function parseCompanyTeamMembers(value: unknown): CompanyTeamMember[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const teamMember = item as Record<string, unknown>;
      const id = typeof teamMember.id === "string" ? teamMember.id : null;
      const name = typeof teamMember.name === "string" ? teamMember.name : null;
      const role = typeof teamMember.role === "string" ? teamMember.role : null;
      const photoUrl = typeof teamMember.photo_url === "string" ? teamMember.photo_url : null;

      if (!id || !name || !role) {
        return null;
      }

      return {
        id,
        name,
        role,
        photo_url: photoUrl,
      };
    })
    .filter((item): item is CompanyTeamMember => item !== null);
}

function parseUnknownList(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value;
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
    tagline: row.tagline ?? null,
    icon: row.icon ?? null,
    gallery: parseStringArray(row.gallery),
    category: row.category || "production",
    features: parseServiceFeatures(row.features),
    process_steps: parseServiceSteps(row.process_steps),
    price_from: row.price_from ?? null,
    price_unit: row.price_unit ?? null,
    duration_days_from: row.duration_days_from ?? null,
    duration_days_to: row.duration_days_to ?? null,
    is_active: row.is_active,
    is_featured: row.is_featured,
    seo_title: row.seo_title ?? null,
    seo_description: row.seo_description ?? null,
  };
}

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
  const normalizedSlug = normalizeSlugValue(slug);
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (!error && data) {
    return data as Product;
  }

  const { data: caseInsensitiveData, error: caseInsensitiveError } = await supabase
    .from("products")
    .select("*")
    .ilike("slug", normalizedSlug)
    .maybeSingle();

  if (caseInsensitiveError || !caseInsensitiveData) {
    return null;
  }

  return caseInsensitiveData as Product;
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
    .select("preset_id, expression, condition")
    .eq("formula_id", formulaId);

  if (componentsError || !components) {
    return [];
  }

  const presetIds = new Set(
    components.map((component) => component.preset_id).filter((value): value is string => Boolean(value)),
  );
  const presetKeys = new Set<string>();

  for (const component of components) {
    for (const identifier of extractPricingIdentifiers(component.expression || "")) {
      presetKeys.add(identifier);
    }

    for (const identifier of extractPricingIdentifiers(component.condition || "")) {
      presetKeys.add(identifier);
    }
  }

  if (presetIds.size === 0 && presetKeys.size === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("price_presets")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as PricePreset[]).filter(
    (preset) => presetIds.has(preset.id) || presetKeys.has(preset.variable_key),
  );
}

export const getServices = cache(async (): Promise<Service[]> => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [...mockServices]
      .filter((service) => service.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [...mockServices]
      .filter((service) => service.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  return data.map(mapService);
});

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return mockServices.find((service) => service.slug === slug && service.is_active) ?? null;
  }

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return mockServices.find((service) => service.slug === slug && service.is_active) ?? null;
  }

  return mapService(data);
});

export async function getDashboardStats() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalInquiries: mockInquiries.length,
      newInquiriesToday: mockInquiries.filter((item) => item.created_at.startsWith(today)).length,
    };
  }

  const [inquiriesResult, inquiriesTodayResult] = await Promise.all([
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date().toISOString().slice(0, 10)),
  ]);

  return {
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

export async function getAllServicesForAdmin(): Promise<Service[]> {
  const supabase = await getSupabaseForAdminQueries();

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

export async function getAllFormulaComponentsForAdmin(): Promise<FormulaComponent[]> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("formula_components")
    .select("*")
    .order("formula_id", { ascending: true })
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

export async function getCompanyInfoForAdmin(): Promise<CompanyInfo | null> {
  const supabase = await getSupabaseForAdminQueries();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("company_info")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    team_members: parseCompanyTeamMembers(data.team_members),
    certificates: parseUnknownList(data.certificates),
  } as CompanyInfo;
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


