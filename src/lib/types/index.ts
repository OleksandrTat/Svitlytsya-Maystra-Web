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
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_location: string | null;
  content: string;
  rating: number;
  project_id: string | null;
  is_visible: boolean;
  created_at: string;
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
  chat_session_id: string | null;
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
  project_id: string | null;
  status: OrderStatus;
  expected_date: string | null;
  actual_date: string | null;
  internal_notes: string | null;
  priority: OrderPriority;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
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
  certificates: unknown[];
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
  input_schema: unknown;
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

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

