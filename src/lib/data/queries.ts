import { cache } from "react";
import { unstable_cache } from "next/cache";
import { mockInquiries, mockServices, mockSiteSettings, mockTestimonials } from "@/lib/data/mock";
import type {
  AuditLogRecord,
  Certificate,
  CompanyInfo,
  CompanyTeamMember,
  Contact,
  Deal,
  DealMessage,
  DealStage,
  DealStageHistory,
  FormulaComponent,
  Inquiry,
  NewsletterSubscriber,
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
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  type SupabaseDataClient,
} from "@/lib/supabase/server";
import {
  parseOrderTemplates,
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
  search?: string;
  priceMin?: number;
  priceMax?: number;
  view: "grid" | "list";
  sort: "default" | "price_asc" | "price_desc" | "newest";
  page: number;
  pageSize: number;
  wishlist?: boolean;      // ?wishlist=1 in URL
  wishlistIds?: string[];  // resolved server-side from wishlist_items table
};

const PRODUCT_SORT_VALUES = ["default", "price_asc", "price_desc", "newest"] as const;

export function parseProductFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ProductFilters {
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const styles = splitCsvParam(typeof searchParams.style === "string" ? searchParams.style : undefined);
  const materials = splitCsvParam(typeof searchParams.material === "string" ? searchParams.material : undefined);
  const featuredValue = typeof searchParams.featured === "string" ? searchParams.featured : undefined;
  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : "default";
  const sort = PRODUCT_SORT_VALUES.includes(sortParam as (typeof PRODUCT_SORT_VALUES)[number])
    ? (sortParam as ProductFilters["sort"])
    : "default";
  const featured =
    featuredValue === "true" || featuredValue === "1" || featuredValue === "yes";
  const page = Number(typeof searchParams.page === "string" ? searchParams.page : "1") || 1;
  const search = typeof searchParams.search === "string" ? searchParams.search.trim() : undefined;
  const priceMinRaw = typeof searchParams.price_min === "string" ? Number(searchParams.price_min) : undefined;
  const priceMaxRaw = typeof searchParams.price_max === "string" ? Number(searchParams.price_max) : undefined;
  const priceMin = priceMinRaw && priceMinRaw > 0 ? priceMinRaw : undefined;
  const priceMax = priceMaxRaw && priceMaxRaw > 0 ? priceMaxRaw : undefined;
  const viewParam = typeof searchParams.view === "string" ? searchParams.view : "grid";
  const view = viewParam === "list" ? "list" : "grid";

  const wishlist = searchParams.wishlist === "1";

  return {
    category,
    status: status as ProductStatus | undefined,
    styles,
    materials,
    featured: featured || undefined,
    search: search || undefined,
    priceMin,
    priceMax,
    view,
    sort,
    page: page > 0 ? page : 1,
    pageSize: 12,
    wishlist: wishlist || undefined,
  };
}

export type CategoryOption = { value: string; count: number };
export type AttributeOption = { value: string; label: string; count: number };

// Case-insensitive aggregator — merges "Дуб" + "дуб" into one, picks the most
// "proper" display form (prefers capitalized), counts actual product usage,
// and resolves a localized label from the supplied lookup map (falling back
// to the display form if the slug isn't present in the lookup table).
function aggregateAttribute(
  products: Array<{ materials?: unknown; style?: unknown }>,
  field: "materials" | "style",
  labelBySlug: Record<string, string>,
): AttributeOption[] {
  const map = new Map<string, { display: string; count: number }>();

  for (const product of products) {
    const raw = product[field];
    if (!Array.isArray(raw)) continue;

    for (const entry of raw) {
      if (typeof entry !== "string") continue;
      const value = entry.trim();
      if (!value) continue;

      const key = value.toLowerCase();
      const existing = map.get(key);

      if (existing) {
        existing.count += 1;
        const currentIsCapitalized = /^[\p{Lu}]/u.test(existing.display);
        const candidateIsCapitalized = /^[\p{Lu}]/u.test(value);
        if (!currentIsCapitalized && candidateIsCapitalized) {
          existing.display = value;
        }
      } else {
        map.set(key, { display: value, count: 1 });
      }
    }
  }

  return Array.from(map.entries())
    .map(([key, v]) => ({
      value: v.display,
      label: labelBySlug[key] ?? labelBySlug[v.display] ?? v.display,
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export type LocaleCode = "uk" | "en";

export async function getProductFilterOptions(
  locale: LocaleCode = "uk",
): Promise<{
  styles: AttributeOption[];
  materials: AttributeOption[];
  categories: CategoryOption[];
  /** Slug → localized label maps for downstream consumers (cards, chips). */
  materialLabelsBySlug: Record<string, string>;
  styleLabelsBySlug: Record<string, string>;
}> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return {
      styles: [],
      materials: [],
      categories: [],
      materialLabelsBySlug: {},
      styleLabelsBySlug: {},
    };
  }

  // Run product scan + lookup tables in parallel.
  const [productsRes, materialsLookupRes, stylesLookupRes] = await Promise.all([
    supabase.from("products").select("category, materials, style").eq("status", "active"),
    supabase.from("materials").select("slug, label_uk, label_en"),
    supabase.from("styles").select("slug, label_uk, label_en"),
  ]);

  const rows = productsRes.data ?? [];

  const pickLabel = (
    slug: string,
    label_uk: string | null | undefined,
    label_en: string | null | undefined,
  ) => {
    if (locale === "en") {
      const en = (label_en ?? "").trim();
      if (en) return en;
    }
    const uk = (label_uk ?? "").trim();
    return uk || slug;
  };

  const buildMap = (
    rows: Array<{ slug: string; label_uk: string | null; label_en: string | null }> | null,
  ) => {
    const out: Record<string, string> = {};
    for (const r of rows ?? []) {
      const slug = (r.slug ?? "").trim();
      if (!slug) continue;
      const label = pickLabel(slug, r.label_uk, r.label_en);
      out[slug] = label;
      out[slug.toLowerCase()] = label;
    }
    return out;
  };

  const materialLabelsBySlug = buildMap(materialsLookupRes.data);
  const styleLabelsBySlug = buildMap(stylesLookupRes.data);

  const categoryCounts = new Map<string, number>();
  for (const product of rows) {
    const cat = typeof product.category === "string" ? product.category.trim() : "";
    if (cat) {
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }
  }

  const materialsShaped = rows.map((r) => ({ materials: r.materials, style: r.style }));

  return {
    styles: aggregateAttribute(materialsShaped, "style", styleLabelsBySlug),
    materials: aggregateAttribute(materialsShaped, "materials", materialLabelsBySlug),
    categories: Array.from(categoryCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "uk")),
    materialLabelsBySlug,
    styleLabelsBySlug,
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

function normalizeSlugValue(value: string) {
  const trimmed = value.trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
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

  // When materials/styles are selected we filter in-memory for case-insensitive
  // matching (handles "Дуб" / "дуб" duplicates gracefully). For the rest of the
  // filter set we stick to server-side pagination.
  const needsInMemoryAttrFilter =
    filters.materials.length > 0 || filters.styles.length > 0;

  let query = supabase
    .from("products")
    .select("*", needsInMemoryAttrFilter ? undefined : { count: "exact" })
    .eq("status", filters.status ?? "active");

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price_from", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price_from", { ascending: false, nullsFirst: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("sort_order", { ascending: true });
      break;
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.featured) {
    query = query.eq("is_featured", true);
  }

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.priceMin) {
    query = query.gte("price_from", filters.priceMin);
  }

  if (filters.priceMax) {
    query = query.lte("price_from", filters.priceMax);
  }

  if (filters.wishlistIds !== undefined) {
    if (filters.wishlistIds.length === 0) return { items: [], total: 0 };
    query = query.in("id", filters.wishlistIds);
  }

  if (needsInMemoryAttrFilter) {
    // Fetch everything that matches the other filters, then apply
    // case-insensitive materials/styles + paginate in memory.
    const { data, error } = await query;
    if (error || !data) {
      return { items: [], total: 0 };
    }

    const normalizedMaterials = filters.materials.map((m) => m.toLowerCase());
    const normalizedStyles = filters.styles.map((s) => s.toLowerCase());

    const filtered = (data as Product[]).filter((product) => {
      if (normalizedMaterials.length > 0) {
        const pm = (Array.isArray(product.materials) ? product.materials : [])
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.toLowerCase());
        if (!normalizedMaterials.every((m) => pm.includes(m))) return false;
      }

      if (normalizedStyles.length > 0) {
        const ps = (Array.isArray(product.style) ? product.style : [])
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.toLowerCase());
        if (!normalizedStyles.every((s) => ps.includes(s))) return false;
      }

      return true;
    });

    const total = filtered.length;
    const start = (filters.page - 1) * filters.pageSize;
    const items = filtered.slice(start, start + filters.pageSize);
    return { items, total };
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
    .ilike("slug", normalizedSlug)
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

export async function getProductByIdForAdmin(id: string): Promise<Product | null> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return null;

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  return (data as Product | null) ?? null;
}

export async function getAllActiveProducts(): Promise<Product[]> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Product[];
}

export async function getPriceFormulaById(
  formulaId: string,
  supabaseClient?: SupabaseDataClient | null,
): Promise<PriceFormula | null> {
  const supabase =
    supabaseClient ?? createSupabaseServiceClient() ?? (await createSupabaseServerClient());
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

export async function getPricePresetsForFormula(
  formulaId: string,
  supabaseClient?: SupabaseDataClient | null,
): Promise<PricePreset[]> {
  const supabase =
    supabaseClient ?? createSupabaseServiceClient() ?? (await createSupabaseServerClient());
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

export async function getRelatedProducts(
  productId: string,
  category: string,
  styles: string[],
  limit = 3,
): Promise<Product[]> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  if (styles.length > 0) {
    const { data: byStyle, error: byStyleError } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .eq("category", category)
      .neq("id", productId)
      .contains("style", styles.slice(0, 1))
      .order("sort_order", { ascending: true })
      .limit(limit);

    if (!byStyleError && byStyle && byStyle.length >= 2) {
      return byStyle as Product[];
    }
  }

  const { data: byCategory, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("category", category)
    .neq("id", productId)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error || !byCategory) {
    return [];
  }

  return byCategory as Product[];
}

export async function getRelatedServices(category: string): Promise<Service[]> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  const serviceCategoryMap: Record<string, string> = {
    doors: "installation",
    windows: "installation",
    furniture: "production",
    restoration: "restoration",
  };

  const serviceCategory = serviceCategoryMap[category];
  if (!serviceCategory) {
    return [];
  }

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .eq("category", serviceCategory)
    .order("sort_order", { ascending: true })
    .limit(2);

  if (error || !data) {
    return [];
  }

  return data.map(mapService);
}

export async function getTestimonialsForProduct(
  productId: string,
  limit = 3,
): Promise<Testimonial[]> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  const { data: linked, error: linkedError } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_visible", true)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!linkedError && linked && linked.length >= 2) {
    return linked as Testimonial[];
  }

  const { data: general, error: generalError } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_visible", true)
    .is("product_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (generalError && linkedError) {
    return [];
  }

  return [...(linked ?? []), ...(general ?? [])].slice(0, limit) as Testimonial[];
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
      return { unreadMessages: 0, newInquiries: 0, unreadSupport: 0, newDeals: 0, unreadDealMessages: 0 };
    }

    const [messagesResult, inquiriesResult, supportResult, newDealsResult, unreadDealMsgResult] = await Promise.all([
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
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("stage", "lead"),
      supabase
        .from("deal_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_type", "client")
        .eq("is_read", false),
    ]);

    return {
      unreadMessages: messagesResult.count ?? 0,
      newInquiries: inquiriesResult.count ?? 0,
      unreadSupport: supportResult.count ?? 0,
      newDeals: newDealsResult.count ?? 0,
      unreadDealMessages: unreadDealMsgResult.count ?? 0,
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

export async function getServiceByIdForAdmin(id: string): Promise<Service | null> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return null;

  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  return data ? mapService(data) : null;
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

export async function getPriceFormulaByIdForAdmin(id: string): Promise<PriceFormula | null> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return null;

  const { data } = await supabase
    .from("price_formulas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return (data as PriceFormula | null) ?? null;
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

  const [companyRes, teamRes] = await Promise.all([
    supabase
      .from("company_info")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("id, name, role, photo_url, sort_order, is_visible")
      .order("sort_order", { ascending: true }),
  ]);

  if (companyRes.error || !companyRes.data) {
    return null;
  }

  const teamMembers: CompanyTeamMember[] = (teamRes.data ?? []).map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role ?? "",
    photo_url: member.photo_url,
  }));

  return {
    ...companyRes.data,
    team_members: teamMembers,
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

// ── CERTIFICATES ─────────────────────────────────────────

export const getPublishedCertificates = cache(async (): Promise<Certificate[]> => {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) return [];
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as Certificate[];
});

export async function getAllCertificatesForAdmin(): Promise<Certificate[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as Certificate[];
}

export async function getCertificateByIdForAdmin(id: string): Promise<Certificate | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .single();
  return (data ?? null) as Certificate | null;
}

// ── NEWSLETTER ───────────────────────────────────────────

export async function getNewsletterSubscribersForAdmin(
  limit = 500,
): Promise<NewsletterSubscriber[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as NewsletterSubscriber[];
}

// ── WISHLIST (admin stats) ───────────────────────────────

export async function getWishlistStatsForAdmin(): Promise<
  { id: string; title: string; slug: string; cover_image: string | null; price_from: number | null; wishlist_count: number }[]
> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return [];

  const { data: wishlistRows } = await supabase
    .from("wishlist_items")
    .select("product_id");

  if (!wishlistRows || wishlistRows.length === 0) return [];

  const countMap = new Map<string, number>();
  for (const row of wishlistRows) {
    countMap.set(row.product_id, (countMap.get(row.product_id) ?? 0) + 1);
  }

  const productIds = [...countMap.keys()];
  const { data: products } = await supabase
    .from("products")
    .select("id, title, slug, cover_image, price_from")
    .in("id", productIds);

  if (!products) return [];

  return products
    .map((p) => ({
      ...p,
      wishlist_count: countMap.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.wishlist_count - a.wishlist_count)
    .slice(0, 20);
}

// ── CRM: CONTACTS ─────────────────────────────────────────

export async function getContactsForAdmin(limit = 200): Promise<Contact[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return [];

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .order("last_activity_at", { ascending: false })
    .limit(limit);

  if (!contacts?.length) return [];

  // Enrich with deal counts
  const { data: dealCounts } = await supabase
    .from("deals")
    .select("contact_id, stage")
    .in("contact_id", contacts.map((c) => c.id));

  const totalMap = new Map<string, number>();
  const openMap = new Map<string, number>();
  const terminalStages = new Set(["completed", "lost", "archived"]);

  for (const d of dealCounts ?? []) {
    totalMap.set(d.contact_id, (totalMap.get(d.contact_id) ?? 0) + 1);
    if (!terminalStages.has(d.stage)) {
      openMap.set(d.contact_id, (openMap.get(d.contact_id) ?? 0) + 1);
    }
  }

  return contacts.map((c) => ({
    ...c,
    deals_count: totalMap.get(c.id) ?? 0,
    open_deals_count: openMap.get(c.id) ?? 0,
  }));
}

export async function getContactByIdForAdmin(id: string): Promise<Contact | null> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return null;

  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  return data ?? null;
}

// ── CRM: DEALS ────────────────────────────────────────────

export async function getDealsForAdmin(limit = 500): Promise<Deal[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return [];

  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!deals?.length) return [];

  // Enrich with contact info
  const contactIds = [...new Set(deals.map((d) => d.contact_id))];
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, phone, email, source, notes, linked_user_id, created_at, last_activity_at")
    .in("id", contactIds);

  const contactMap = new Map((contacts ?? []).map((c) => [c.id, c]));

  // Enrich with unread message counts
  const dealIds = deals.map((d) => d.id);
  const { data: unread } = await supabase
    .from("deal_messages")
    .select("deal_id")
    .in("deal_id", dealIds)
    .eq("sender_type", "client")
    .eq("is_read", false);

  const unreadMap = new Map<string, number>();
  for (const m of unread ?? []) {
    unreadMap.set(m.deal_id, (unreadMap.get(m.deal_id) ?? 0) + 1);
  }

  return deals.map((d) => ({
    ...d,
    contact: contactMap.get(d.contact_id),
    unread_count: unreadMap.get(d.id) ?? 0,
  }));
}

export async function getDealByIdForAdmin(id: string): Promise<Deal | null> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return null;

  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return null;

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", data.contact_id)
    .single();

  return { ...data, contact: contact ?? undefined };
}

export async function getContactDealsForAdmin(contactId: string): Promise<Deal[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return [];

  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

// ── CRM: DEAL MESSAGES ────────────────────────────────────

export async function getDealMessagesForAdmin(dealId: string): Promise<DealMessage[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return [];

  const { data } = await supabase
    .from("deal_messages")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true })
    .limit(300);

  // Mark client messages as read
  await supabase
    .from("deal_messages")
    .update({ is_read: true })
    .eq("deal_id", dealId)
    .eq("sender_type", "client")
    .eq("is_read", false);

  return data ?? [];
}

export async function getDealStageHistoryForAdmin(dealId: string): Promise<DealStageHistory[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return [];

  const { data } = await supabase
    .from("deal_stage_history")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

// Deals with unread messages — for the messages inbox
export async function getDealsWithMessagesForAdmin(limit = 100): Promise<Deal[]> {
  const supabase = await getSupabaseForAdminQueries();
  if (!supabase) return [];

  // Get deals that have at least one message, ordered by last message
  const { data: recentMessages } = await supabase
    .from("deal_messages")
    .select("deal_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  if (!recentMessages?.length) return [];

  // Unique deal IDs preserving order (most recent first)
  const seen = new Set<string>();
  const orderedDealIds: string[] = [];
  for (const m of recentMessages) {
    if (!seen.has(m.deal_id)) {
      seen.add(m.deal_id);
      orderedDealIds.push(m.deal_id);
      if (orderedDealIds.length >= limit) break;
    }
  }

  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .in("id", orderedDealIds);

  if (!deals?.length) return [];

  const contactIds = [...new Set(deals.map((d) => d.contact_id))];
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, phone, email, source, notes, linked_user_id, created_at, last_activity_at")
    .in("id", contactIds);

  const contactMap = new Map((contacts ?? []).map((c) => [c.id, c]));

  const { data: unread } = await supabase
    .from("deal_messages")
    .select("deal_id")
    .in("deal_id", orderedDealIds)
    .eq("sender_type", "client")
    .eq("is_read", false);

  const unreadMap = new Map<string, number>();
  for (const m of unread ?? []) {
    unreadMap.set(m.deal_id, (unreadMap.get(m.deal_id) ?? 0) + 1);
  }

  // Return in order of last message
  const dealMap = new Map(deals.map((d) => [d.id, d]));
  return orderedDealIds
    .map((id) => {
      const d = dealMap.get(id);
      if (!d) return null;
      return {
        ...d,
        contact: contactMap.get(d.contact_id),
        unread_count: unreadMap.get(d.id) ?? 0,
      };
    })
    .filter(Boolean) as Deal[];
}
