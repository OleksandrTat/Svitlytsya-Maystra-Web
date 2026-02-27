export type ProjectCategory = "doors" | "furniture" | "windows";
export type ProjectStatus = "public" | "nda" | "concept";
export type InquiryStatus = "new" | "in_progress" | "done" | "archived";
export type ChatRole = "user" | "assistant";
export type ProductType = "door" | "furniture" | "window";
export type BlogCommentStatus = "pending" | "approved" | "rejected";

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
  is_featured: boolean;
  cover_image: string;
  images: string[];
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
  phone: string;
  email: string | null;
  service_type: string;
  message: string | null;
  source_page: string | null;
  project_ref_id: string | null;
  configuration: Record<string, unknown> | null;
  chat_session_id: string | null;
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
  status?: Exclude<ProjectStatus, "nda">;
  page: number;
  pageSize: number;
};

