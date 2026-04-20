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
      products: {
        Row: {
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
          status: "active" | "draft" | "archived";
          sort_order: number;
          priority?: number | null;
          is_featured: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
          title_en: string | null;
          description_en: string | null;
          short_description_en: string | null;
          seo_title_en: string | null;
          seo_description_en: string | null;
        };
        Insert: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          short_description?: string | null;
          category?: string;
          materials?: string[];
          style?: string[];
          cover_image?: string | null;
          model_3d_url?: string | null;
          images?: string[];
          price_from?: number | null;
          formula_id?: string | null;
          status?: "active" | "draft" | "archived";
          sort_order?: number;
          priority?: number | null;
          is_featured?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
          title_en?: string | null;
          description_en?: string | null;
          short_description_en?: string | null;
          seo_title_en?: string | null;
          seo_description_en?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      materials: {
        Row: {
          slug: string;
          label_uk: string;
          label_en: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          label_uk: string;
          label_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
        Relationships: [];
      };
      styles: {
        Row: {
          slug: string;
          label_uk: string;
          label_en: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          label_uk: string;
          label_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["styles"]["Insert"]>;
        Relationships: [];
      };
      product_materials: {
        Row: {
          product_id: string;
          material_slug: string;
        };
        Insert: {
          product_id: string;
          material_slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_materials"]["Insert"]>;
        Relationships: [];
      };
      product_styles: {
        Row: {
          product_id: string;
          style_slug: string;
        };
        Insert: {
          product_id: string;
          style_slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_styles"]["Insert"]>;
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
      support_chats: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          subject: string | null;
          channel: "internal" | "email" | "viber" | "whatsapp";
          status: "open" | "waiting" | "resolved" | "closed";
          preferred_contact: string | null;
          created_at: string;
          updated_at: string;
          last_message_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          subject?: string | null;
          channel?: "internal" | "email" | "viber" | "whatsapp";
          status?: "open" | "waiting" | "resolved" | "closed";
          preferred_contact?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["support_chats"]["Insert"]>;
        Relationships: [];
      };
      support_messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_type: "client" | "admin" | "system";
          sender_id: string | null;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_type: "client" | "admin" | "system";
          sender_id?: string | null;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_messages"]["Insert"]>;
        Relationships: [];
      };
rate_limit_events: {
        Row: {
          id: string;
          key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limit_events"]["Insert"]>;
        Relationships: [];
      };
      service_categories: {
        Row: {
          slug: string;
          label_uk: string;
          label_en: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          label_uk: string;
          label_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_categories"]["Insert"]>;
        Relationships: [];
      };
      product_categories: {
        Row: {
          slug: string;
          label_uk: string;
          label_en: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          label_uk: string;
          label_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>;
        Relationships: [];
      };
      blog_categories: {
        Row: {
          slug: string;
          label_uk: string;
          label_en: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          label_uk: string;
          label_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_categories"]["Insert"]>;
        Relationships: [];
      };
      faq_categories: {
        Row: {
          slug: string;
          label_uk: string;
          label_en: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          label_uk: string;
          label_en?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["faq_categories"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          title: string;
          slug: string;
          tagline: string | null;
          short_description: string;
          description: string;
          icon: string | null;
          process_steps: Json;
          cover_image: string | null;
          gallery: string[];
          category: string;
          features: Json;
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
          title_en: string | null;
          tagline_en: string | null;
          short_description_en: string | null;
          description_en: string | null;
          seo_title_en: string | null;
          seo_description_en: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          tagline?: string | null;
          short_description: string;
          description: string;
          icon?: string | null;
          process_steps?: Json;
          cover_image?: string | null;
          gallery?: string[];
          category?: string;
          features?: Json;
          price_from?: number | null;
          price_unit?: string | null;
          duration_days_from?: number | null;
          duration_days_to?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          title_en?: string | null;
          tagline_en?: string | null;
          short_description_en?: string | null;
          description_en?: string | null;
          seo_title_en?: string | null;
          seo_description_en?: string | null;
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
          product_id: string | null;
          is_visible: boolean;
          created_at: string;
          author_location_en: string | null;
          content_en: string | null;
        };
        Insert: {
          id?: string;
          author_name: string;
          author_location?: string | null;
          content: string;
          rating?: number;
          product_id?: string | null;
          is_visible?: boolean;
          created_at?: string;
          author_location_en?: string | null;
          content_en?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Insert"]>;
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          service_type: string;
          message: string | null;
          source_page: string | null;
          configuration: Json | null;
          channel: "web_form" | "phone" | "direct" | "referral";
          status:
            | "new"
            | "contacted"
            | "quoted"
            | "won"
            | "lost"
            | "in_progress"
            | "done"
            | "archived";
          contact_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          service_type: string;
          message?: string | null;
          source_page?: string | null;
          configuration?: Json | null;
          channel?: "web_form" | "phone" | "direct" | "referral";
          status?:
            | "new"
            | "contacted"
            | "quoted"
            | "won"
            | "lost"
            | "in_progress"
            | "done"
            | "archived";
          contact_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Insert"]>;
        Relationships: [];
      };
      client_invitations: {
        Row: {
          id: string;
          inquiry_id: string | null;
          email: string;
          token_hash: string;
          status: string;
          invited_by: string | null;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          inquiry_id?: string | null;
          email: string;
          token_hash: string;
          status?: string;
          invited_by?: string | null;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["client_invitations"]["Insert"]>;
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          account_types: string[];
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          account_types?: string[];
          created_at?: string;
          last_seen_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          inquiry_id: string | null;
          user_id: string | null;
          product_id: string | null;
          status:
            | "new"
            | "consulting"
            | "design"
            | "approved"
            | "production"
            | "ready"
            | "installation"
            | "completed"
            | "archived";
          expected_date: string | null;
          actual_date: string | null;
          internal_notes: string | null;
          priority: "normal" | "urgent";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          inquiry_id?: string | null;
          user_id?: string | null;
          product_id?: string | null;
          status?:
            | "new"
            | "consulting"
            | "design"
            | "approved"
            | "production"
            | "ready"
            | "installation"
            | "completed"
            | "archived";
          expected_date?: string | null;
          actual_date?: string | null;
          internal_notes?: string | null;
          priority?: "normal" | "urgent";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity?: number;
          unit_price?: number | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status:
            | "new"
            | "consulting"
            | "design"
            | "approved"
            | "production"
            | "ready"
            | "installation"
            | "completed"
            | "archived"
            | null;
          to_status:
            | "new"
            | "consulting"
            | "design"
            | "approved"
            | "production"
            | "ready"
            | "installation"
            | "completed"
            | "archived";
          comment: string | null;
          is_visible_to_client: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?:
            | "new"
            | "consulting"
            | "design"
            | "approved"
            | "production"
            | "ready"
            | "installation"
            | "completed"
            | "archived"
            | null;
          to_status:
            | "new"
            | "consulting"
            | "design"
            | "approved"
            | "production"
            | "ready"
            | "installation"
            | "completed"
            | "archived";
          comment?: string | null;
          is_visible_to_client?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Insert"]>;
        Relationships: [];
      };
      order_photos: {
        Row: {
          id: string;
          order_id: string;
          image_url: string;
          caption: string | null;
          stage:
            | "new"
            | "consulting"
            | "design"
            | "approved"
            | "production"
            | "ready"
            | "installation"
            | "completed"
            | "archived";
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          image_url: string;
          caption?: string | null;
          stage?:
            | "new"
            | "consulting"
            | "design"
            | "approved"
            | "production"
            | "ready"
            | "installation"
            | "completed"
            | "archived";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_photos"]["Insert"]>;
        Relationships: [];
      };
      order_documents: {
        Row: {
          id: string;
          order_id: string;
          type: "contract" | "act";
          file_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          type: "contract" | "act";
          file_url: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_documents"]["Insert"]>;
        Relationships: [];
      };
      order_messages: {
        Row: {
          id: string;
          order_id: string;
          sender_type: "client" | "admin";
          sender_id: string | null;
          content: string;
          attachment_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          sender_type: "client" | "admin";
          sender_id?: string | null;
          content: string;
          attachment_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_messages"]["Insert"]>;
        Relationships: [];
      };
      price_presets: {
        Row: {
          id: string;
          name: string;
          category: "material" | "consumable" | "labor" | "overhead";
          variable_key: string;
          unit: string;
          value: number;
          currency: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: "material" | "consumable" | "labor" | "overhead";
          variable_key: string;
          unit: string;
          value: number;
          currency?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["price_presets"]["Insert"]>;
        Relationships: [];
      };
      price_formulas: {
        Row: {
          id: string;
          name: string;
          product_type: "door" | "furniture" | "window" | "restoration";
          description: string | null;
          user_inputs: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          product_type: "door" | "furniture" | "window" | "restoration";
          description?: string | null;
          user_inputs?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["price_formulas"]["Insert"]>;
        Relationships: [];
      };
      formula_components: {
        Row: {
          id: string;
          formula_id: string;
          type: "material" | "consumable" | "labor" | "overhead" | "tax" | "margin";
          label: string;
          preset_id: string | null;
          expression: string;
          condition: string | null;
          notes: string | null;
          is_discount: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          formula_id: string;
          type: "material" | "consumable" | "labor" | "overhead" | "tax" | "margin";
          label: string;
          preset_id?: string | null;
          expression: string;
          condition?: string | null;
          notes?: string | null;
          is_discount?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["formula_components"]["Insert"]>;
        Relationships: [];
      };
      order_calculations: {
        Row: {
          id: string;
          order_id: string;
          formula_id: string;
          input_params: Json;
          breakdown: Json;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          formula_id: string;
          input_params?: Json;
          breakdown?: Json;
          total: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_calculations"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_type: "admin" | "client" | "system" | "anonymous";
          action: "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
          table_name: string;
          record_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_type?: "admin" | "client" | "system" | "anonymous";
          action: "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
          table_name: string;
          record_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
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
      company_info: {
        Row: {
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
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          tagline?: string | null;
          description?: string | null;
          founded_year?: number | null;
          email?: string | null;
          phone?: string | null;
          phone_secondary?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          working_hours?: string | null;
          logo_url?: string | null;
          og_image_url?: string | null;
          social_facebook?: string | null;
          social_instagram?: string | null;
          social_youtube?: string | null;
          social_tiktok?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_info"]["Insert"]>;
        Relationships: [];
      };
faq_items: {
        Row: {
          id: string;
          question: string;
          answer: string;
          category: string;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          question_en: string | null;
          answer_en: string | null;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          category?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          question_en?: string | null;
          answer_en?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["faq_items"]["Insert"]>;
        Relationships: [];
      };
      certificates: {
        Row: {
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
          title_en: string | null;
          description_en: string | null;
          issuer_en: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          issuer: string;
          issued_year?: number | null;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          title_en?: string | null;
          description_en?: string | null;
          issuer_en?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["certificates"]["Insert"]>;
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wishlist_items"]["Insert"]>;
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          status: "active" | "unsubscribed" | "bounced";
          source: string | null;
          subscribed_at: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          status?: "active" | "unsubscribed" | "bounced";
          source?: string | null;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      orders_with_clients: {
        Row: {
          id: string;
          order_number: string;
          status:
            | "new"
            | "consulting"
            | "design"
            | "approved"
            | "production"
            | "ready"
            | "installation"
            | "completed"
            | "archived";
          priority: "normal" | "urgent";
          expected_date: string | null;
          actual_date: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
          client_name: string | null;
          client_phone: string | null;
          client_email: string | null;
          service_type: string | null;
          registered_client_name: string | null;
          product_title: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      product_status: "active" | "draft" | "archived";
      inquiry_status:
        | "new"
        | "contacted"
        | "quoted"
        | "won"
        | "lost"
        | "in_progress"
        | "done"
        | "archived";
      inquiry_channel: "web_form" | "phone" | "direct" | "referral";
      product_type: "door" | "furniture" | "window";
      order_status:
        | "new"
        | "consulting"
        | "design"
        | "approved"
        | "production"
        | "ready"
        | "installation"
        | "completed"
        | "archived";
      order_priority: "normal" | "urgent";
      order_message_sender_type: "client" | "admin";
      order_document_type: "contract" | "act";
      price_preset_category: "material" | "consumable" | "labor" | "overhead";
      pricing_product_type: "door" | "furniture" | "window" | "restoration";
      formula_component_type: "material" | "consumable" | "labor" | "overhead" | "tax" | "margin";
      support_channel: "internal" | "email" | "viber" | "whatsapp";
      support_chat_status: "open" | "waiting" | "resolved" | "closed";
      support_message_sender: "client" | "admin" | "system";
      audit_actor_type: "admin" | "client" | "system" | "anonymous";
      audit_action: "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
    };
    CompositeTypes: Record<string, never>;
  };
}

