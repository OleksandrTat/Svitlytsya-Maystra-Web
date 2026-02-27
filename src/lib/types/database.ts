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
          configuration: Json | null;
          chat_session_id: string | null;
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
          configuration?: Json | null;
          chat_session_id?: string | null;
          status?: "new" | "in_progress" | "done" | "archived";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Insert"]>;
        Relationships: [];
      };
      ai_chat_sessions: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          language: string;
          messages_count: number;
          resulted_in_inquiry: boolean;
          inquiry_id: string | null;
          created_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          language?: string;
          messages_count?: number;
          resulted_in_inquiry?: boolean;
          inquiry_id?: string | null;
          created_at?: string;
          last_message_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_chat_sessions"]["Insert"]>;
        Relationships: [];
      };
      ai_chat_messages: {
        Row: {
          id: string;
          chat_session_id: string;
          role: "user" | "assistant";
          content: string;
          tokens_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_session_id: string;
          role: "user" | "assistant";
          content: string;
          tokens_used?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_chat_messages"]["Insert"]>;
        Relationships: [];
      };
      product_configurations: {
        Row: {
          id: string;
          product_type: "door" | "furniture" | "window";
          configuration_key: string;
          parameters: Json;
          image_url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_type: "door" | "furniture" | "window";
          configuration_key: string;
          parameters?: Json;
          image_url: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_configurations"]["Insert"]>;
        Relationships: [];
      };
      saved_configurations: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string | null;
          product_type: "door" | "furniture" | "window";
          configuration: Json;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          product_type: "door" | "furniture" | "window";
          configuration?: Json;
          name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_configurations"]["Insert"]>;
        Relationships: [];
      };
      blog_posts: {
        Row: {
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
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          cover_image?: string | null;
          category: string;
          tags?: string[];
          reading_time_min?: number;
          is_published?: boolean;
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Insert"]>;
        Relationships: [];
      };
      cultural_blog_posts: {
        Row: {
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
          guest_author_name: string | null;
          guest_author_bio: string | null;
          allow_comments: boolean;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          cover_image?: string | null;
          category?: string;
          tags?: string[];
          reading_time_min?: number;
          is_published?: boolean;
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          guest_author_name?: string | null;
          guest_author_bio?: string | null;
          allow_comments?: boolean;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cultural_blog_posts"]["Insert"]>;
        Relationships: [];
      };
      blog_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_comments"]["Insert"]>;
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          account_types: string[];
          email_preferences: Json;
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          account_types?: string[];
          email_preferences?: Json;
          created_at?: string;
          last_seen_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
        Relationships: [];
      };
      email_subscribers: {
        Row: {
          id: string;
          email: string;
          user_id: string | null;
          preferences: Json;
          status: "subscribed" | "unsubscribed" | "bounced" | "complained";
          subscribed_at: string;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          user_id?: string | null;
          preferences?: Json;
          status?: "subscribed" | "unsubscribed" | "bounced" | "complained";
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_subscribers"]["Insert"]>;
        Relationships: [];
      };
      email_campaigns: {
        Row: {
          id: string;
          title: string;
          subject: string;
          html_content: string;
          status: "draft" | "scheduled" | "sending" | "sent" | "failed";
          scheduled_at: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subject: string;
          html_content: string;
          status?: "draft" | "scheduled" | "sending" | "sent" | "failed";
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_campaigns"]["Insert"]>;
        Relationships: [];
      };
      email_sends: {
        Row: {
          id: string;
          campaign_id: string;
          subscriber_id: string;
          status: string;
          opened_at: string | null;
          clicked_at: string | null;
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          subscriber_id: string;
          status?: string;
          opened_at?: string | null;
          clicked_at?: string | null;
          sent_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_sends"]["Insert"]>;
        Relationships: [];
      };
      email_sequences: {
        Row: {
          id: string;
          name: string;
          trigger_type: string;
          steps: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          trigger_type: string;
          steps?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_sequences"]["Insert"]>;
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
      chat_role: "user" | "assistant";
      product_type: "door" | "furniture" | "window";
      blog_comment_status: "pending" | "approved" | "rejected";
      email_subscriber_status: "subscribed" | "unsubscribed" | "bounced" | "complained";
      email_campaign_status: "draft" | "scheduled" | "sending" | "sent" | "failed";
    };
    CompositeTypes: Record<string, never>;
  };
}

