export type ProjectCategory = "doors" | "furniture" | "windows";
export type ProjectStatus = "public" | "nda" | "concept";
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
export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
export type PaymentMethod = "cash" | "bank_transfer" | "card" | "other";
export type InquiryChannel = "web_form" | "ai_chat" | "phone" | "direct" | "referral";
export type SupportChannel = "internal" | "email" | "viber" | "whatsapp";
export type SupportChatStatus = "open" | "waiting" | "resolved" | "closed";
export type SupportMessageSender = "client" | "admin" | "system";
export type ChatRole = "user" | "assistant";
export type ProductType = "door" | "furniture" | "window";
export type BlogCommentStatus = "pending" | "approved" | "rejected";
export type ProjectPrivacyLevel = "public" | "nda_partial" | "nda_full";
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

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory;
  style: string[];
  materials: string[];
  dimensions: string | null;
  location: string | null;
  completed_at: string | null;
  duration_days: number | null;
  status: ProjectStatus;
  privacy_level: ProjectPrivacyLevel;
  is_featured: boolean;
  sort_order: number;
  cover_image: string;
  images: string[];
  blurred_images: string[];
  private_client_name: string | null;
  private_location: string | null;
  private_notes: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
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
  short_description: string;
  description: string;
  process_steps: string[];
  cover_image: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
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
  project_ref_id: string | null;
  configuration: Record<string, unknown> | null;
  chat_session_id: string | null;
  channel: InquiryChannel;
  status: InquiryStatus;
  created_at: string;
}

export interface AIChatSession {
  id: string;
  session_id: string;
  user_id: string | null;
  language: string;
  messages_count: number;
  resulted_in_inquiry: boolean;
  inquiry_id: string | null;
  created_at: string;
  last_message_at: string;
}

export interface AIChatMessage {
  id: string;
  chat_session_id: string;
  role: ChatRole;
  content: string;
  tokens_used: number;
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

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  total: number;
  paid_amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  notes: string | null;
  issued_at: string;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  notes: string | null;
  paid_at: string;
  created_at: string;
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

export type CatalogFilters = {
  category?: ProjectCategory;
  styles: string[];
  materials: string[];
  status?: Exclude<ProjectStatus, "concept">;
  page: number;
  pageSize: number;
};

