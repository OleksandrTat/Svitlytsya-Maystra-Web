export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          category: "doors" | "furniture" | "windows";
          style: string[];
          materials: string[];
          dimensions: string | null;
          location: string | null;
          completed_at: string | null;
          duration_days: number | null;
          status: "public" | "nda" | "concept";
          is_featured: boolean;
          cover_image: string;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          category: "doors" | "furniture" | "windows";
          style?: string[];
          materials?: string[];
          dimensions?: string | null;
          location?: string | null;
          completed_at?: string | null;
          duration_days?: number | null;
          status?: "public" | "nda" | "concept";
          is_featured?: boolean;
          cover_image: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          title: string;
          slug: string;
          short_description: string;
          description: string;
          process_steps: Json;
          cover_image: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          short_description: string;
          description: string;
          process_steps?: Json;
          cover_image: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          author_name: string;
          author_location: string | null;
          content: string;
          rating: number;
          project_id: string | null;
          is_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_name: string;
          author_location?: string | null;
          content: string;
          rating?: number;
          project_id?: string | null;
          is_visible?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Insert"]>;
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          service_type: string;
          message: string | null;
          source_page: string | null;
          project_ref_id: string | null;
          status: "new" | "in_progress" | "done" | "archived";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          service_type: string;
          message?: string | null;
          source_page?: string | null;
          project_ref_id?: string | null;
          status?: "new" | "in_progress" | "done" | "archived";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Insert"]>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          action: string;
          entity: string;
          entity_id: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          entity: string;
          entity_id?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_category: "doors" | "furniture" | "windows";
      project_status: "public" | "nda" | "concept";
      inquiry_status: "new" | "in_progress" | "done" | "archived";
    };
    CompositeTypes: Record<string, never>;
  };
}

