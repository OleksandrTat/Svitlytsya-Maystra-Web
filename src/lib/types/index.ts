export type InquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "won"
  | "lost"
  | "in_progress"
  | "done"
  | "archived";
export type ProductStatus = "active" | "draft" | "archived";
export type InquiryChannel = "web_form" | "phone" | "direct" | "referral";
export type SupportChannel = "internal" | "email" | "viber" | "whatsapp";
export type SupportChatStatus = "open" | "waiting" | "resolved" | "closed";
export type SupportMessageSender = "client" | "admin" | "system";
export type ProductType = "door" | "furniture" | "window";
export type OrderStatus =
  | "new"
  | "consulting"
  | "design"
  | "approved"
  | "production"
  | "ready"
  | "installation"
  | "completed"
  | "archived";
export type OrderPriority = "normal" | "urgent";
export type OrderMessageSenderType = "client" | "admin";
export type PricePresetCategory = "material" | "consumable" | "labor" | "overhead";
export type PricingProductType = "door" | "furniture" | "window" | "restoration";
export type FormulaComponentType =
  | "material"
  | "consumable"
  | "labor"
  | "overhead"
  | "tax"
  | "margin";

export interface ServiceFeature {
  title: string;
  description: string;
}

export interface ServiceProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  category: string;
  materials: string[];
  style: string[];
  cover_image: string | null;
  model_3d_url: string | null;
  images: string[];
  price_from: number | null;
  formula_id: string | null;
  status: ProductStatus;
  sort_order: number;
  priority?: number | null;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  // i18n EN fields
  title_en?: string | null;
  description_en?: string | null;
  short_description_en?: string | null;
  seo_title_en?: string | null;
  seo_description_en?: string | null;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  short_description: string;
  description: string;
  icon: string | null;
  cover_image: string | null;
  gallery: string[];
  category: string;
  features: ServiceFeature[];
  process_steps: ServiceProcessStep[];
  price_from: number | null;
  price_unit: string | null;
  duration_days_from: number | null;
  duration_days_to: number | null;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // i18n EN fields
  title_en?: string | null;
  tagline_en?: string | null;
  short_description_en?: string | null;
  description_en?: string | null;
  seo_title_en?: string | null;
  seo_description_en?: string | null;
  features_en?: ServiceFeature[] | null;
  process_steps_en?: ServiceProcessStep[] | null;
}

export interface SavedConfiguration {
  id: string;
  session_id: string | null;
  user_id: string | null;
  product_type: ProductType;
  configuration: Record<string, unknown>;
  name: string | null;
  created_at: string;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_location: string | null;
  content: string;
  rating: number;
  product_id: string | null;
  is_visible: boolean;
  created_at: string;
  // i18n EN fields
  author_location_en?: string | null;
  content_en?: string | null;
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  service_type: string;
  message: string | null;
  source_page: string | null;
  configuration: Record<string, unknown> | null;
  channel: InquiryChannel;
  status: InquiryStatus;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  inquiry_id: string | null;
  user_id: string | null;
  product_id: string | null;
  status: OrderStatus;
  expected_date: string | null;
  actual_date: string | null;
  internal_notes: string | null;
  priority: OrderPriority;
  created_at: string;
  updated_at: string;
}

export interface CompanyTeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
}

export interface CompanyInfo {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  founded_year: number | null;
  email: string | null;
  phone: string | null;
  phone_secondary: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  working_hours: string | null;
  logo_url: string | null;
  og_image_url: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  team_members: CompanyTeamMember[];
  updated_at: string;
}

export interface SupportChat {
  id: string;
  user_id: string;
  order_id: string | null;
  subject: string | null;
  channel: SupportChannel;
  status: SupportChatStatus;
  preferred_contact: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  resolved_at: string | null;
}

export interface SupportMessage {
  id: string;
  chat_id: string;
  sender_type: SupportMessageSender;
  sender_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  comment: string | null;
  is_visible_to_client: boolean;
  created_by: string | null;
  created_at: string;
}

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_type: OrderMessageSenderType;
  sender_id: string | null;
  content: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PricePreset {
  id: string;
  name: string;
  category: PricePresetCategory;
  variable_key: string;
  unit: string;
  value: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceFormula {
  id: string;
  name: string;
  product_type: PricingProductType;
  description: string | null;
  user_inputs: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormulaComponent {
  id: string;
  formula_id: string;
  type: FormulaComponentType;
  label: string;
  preset_id: string | null;
  expression: string;
  condition: string | null;
  notes: string | null;
  is_discount: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string | null;
  actor_type: "admin" | "client" | "system" | "anonymous";
  action: "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
  table_name: string;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  description: string | null;
}

// ── BLOG ──────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  category: string;
  tags: string[];
  reading_time_min: number;
  is_published: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar: string | null;
  is_featured: boolean;
  views_count: number;
  likes_count: number;
  related_service_id: string | null;
  related_product_id: string | null;
  // i18n EN fields
  title_en?: string | null;
  excerpt_en?: string | null;
  content_en?: string | null;
  seo_title_en?: string | null;
  seo_description_en?: string | null;
}

export type BlogPostStatus = "published" | "draft";

export interface BlogFilters {
  category?: string;
  tag?: string;
  search?: string;
  page: number;
  pageSize: number;
}

// ── FAQ ──────────────────────────────────────────────────

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // i18n EN fields
  question_en?: string | null;
  answer_en?: string | null;
}

// ── CERTIFICATES ─────────────────────────────────────────

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issued_year: number | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // i18n EN fields
  title_en: string | null;
  description_en: string | null;
  issuer_en: string | null;
  // SEO
  seo_title: string | null;
  seo_description: string | null;
  seo_title_en: string | null;
  seo_description_en: string | null;
}

// ── CRM: CONTACTS + DEALS ────────────────────────────────

export type DealStage =
  | "lead"
  | "contacted"
  | "quoted"
  | "consulting"
  | "design"
  | "approved"
  | "production"
  | "ready"
  | "installation"
  | "completed"
  | "lost"
  | "archived";

export type DealPriority = "normal" | "urgent";
export type DealMessageSender = "client" | "admin" | "system";
export type DealMessageChannel = "internal" | "viber" | "whatsapp" | "email" | "phone_note";

export interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  notes: string | null;
  linked_user_id: string | null;
  created_at: string;
  last_activity_at: string;
  // enriched
  deals_count?: number;
  open_deals_count?: number;
}

export interface Deal {
  id: string;
  contact_id: string;
  title: string;
  service_type: string | null;
  stage: DealStage;
  priority: DealPriority;
  value: number | null;
  expected_date: string | null;
  internal_notes: string | null;
  inquiry_id: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
  // enriched
  contact?: Contact;
  unread_count?: number;
}

export interface DealMessage {
  id: string;
  deal_id: string;
  sender_type: DealMessageSender;
  sender_id: string | null;
  channel: DealMessageChannel;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DealStageHistory {
  id: string;
  deal_id: string;
  from_stage: DealStage | null;
  to_stage: DealStage;
  comment: string | null;
  created_by: string | null;
  created_at: string;
}

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  lead:         "Новий лід",
  contacted:    "Контакт",
  quoted:       "КП надіслано",
  consulting:   "Консультація",
  design:       "Проект",
  approved:     "Погоджено",
  production:   "Виробництво",
  ready:        "Готово",
  installation: "Монтаж",
  completed:    "Завершено",
  lost:         "Відмова",
  archived:     "Архів",
};

export const DEAL_STAGE_COLORS: Record<DealStage, { bg: string; text: string; dot: string }> = {
  lead:         { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400" },
  contacted:    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  quoted:       { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400" },
  consulting:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  design:       { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400" },
  approved:     { bg: "bg-lime-50",    text: "text-lime-700",    dot: "bg-lime-400" },
  production:   { bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-500" },
  ready:        { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-400" },
  installation: { bg: "bg-cyan-50",    text: "text-cyan-700",    dot: "bg-cyan-400" },
  completed:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  lost:         { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400" },
  archived:     { bg: "bg-zinc-50",    text: "text-zinc-500",    dot: "bg-zinc-300" },
};

// Stages shown on the Kanban board (terminal stages hidden by default)
export const PIPELINE_STAGES: DealStage[] = [
  "lead", "contacted", "quoted",
  "consulting", "design", "approved",
  "production", "ready", "installation",
];

// ── NEWSLETTER ───────────────────────────────────────────

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  status: "active" | "unsubscribed" | "bounced";
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

