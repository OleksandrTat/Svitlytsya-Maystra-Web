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
          privacy_level: "public" | "nda_partial" | "nda_full";
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
          privacy_level?: "public" | "nda_partial" | "nda_full";
          is_featured?: boolean;
          sort_order?: number;
          cover_image: string;
          images?: string[];
          blurred_images?: string[];
          private_client_name?: string | null;
          private_location?: string | null;
          private_notes?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
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
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_attributes: {
        Row: {
          id: string;
          category: string;
          type: "style" | "material";
          value: string;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          type: "style" | "material";
          value: string;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_attributes"]["Insert"]>;
        Relationships: [];
      };
      project_products: {
        Row: {
          id: string;
          project_id: string;
          product_id: string;
          quantity: number;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          product_id: string;
          quantity?: number;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_products"]["Insert"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          order_id: string;
          total: number;
          paid_amount: number;
          status: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
          due_date: string | null;
          notes: string | null;
          issued_at: string;
          sent_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number?: string;
          order_id: string;
          total: number;
          paid_amount?: number;
          status?: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
          due_date?: string | null;
          notes?: string | null;
          issued_at?: string;
          sent_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          order_id: string;
          amount: number;
          method: "cash" | "bank_transfer" | "card" | "other";
          notes: string | null;
          paid_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          order_id: string;
          amount: number;
          method?: "cash" | "bank_transfer" | "card" | "other";
          notes?: string | null;
          paid_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
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
      admin_push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_push_subscriptions"]["Insert"]>;
        Relationships: [];
      };

      rate_limit_store: {
        Row: {
          key: string;
          timestamps: string[];
          updated_at: string;
        };
        Insert: {
          key: string;
          timestamps?: string[];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limit_store"]["Insert"]>;
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
          phone: string | null;
          email: string | null;
          service_type: string;
          message: string | null;
          source_page: string | null;
          project_ref_id: string | null;
          configuration: Json | null;
          chat_session_id: string | null;
          channel: "web_form" | "ai_chat" | "phone" | "direct" | "referral";
          status:
            | "new"
            | "contacted"
            | "quoted"
            | "won"
            | "lost"
            | "in_progress"
            | "done"
            | "archived";
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
          project_ref_id?: string | null;
          configuration?: Json | null;
          chat_session_id?: string | null;
          channel?: "web_form" | "ai_chat" | "phone" | "direct" | "referral";
          status?:
            | "new"
            | "contacted"
            | "quoted"
            | "won"
            | "lost"
            | "in_progress"
            | "done"
            | "archived";
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
          token: string;
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
          token?: string;
          status?: string;
          invited_by?: string | null;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["client_invitations"]["Insert"]>;
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
      order_notifications: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          type: "status_changed" | "photo_added" | "message_received" | "order_ready";
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          type: "status_changed" | "photo_added" | "message_received" | "order_ready";
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_notifications"]["Insert"]>;
        Relationships: [];
      };
      price_presets: {
        Row: {
          id: string;
          name: string;
          category: "material" | "consumable" | "labor" | "overhead";
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
          input_schema: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          product_type: "door" | "furniture" | "window" | "restoration";
          description?: string | null;
          input_schema?: Json;
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
    Views: {
      projects_public: {
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
          cover_image: string | null;
          images: string[];
          status: "public" | "nda" | "concept";
          privacy_level: "public" | "nda_partial" | "nda_full";
          is_featured: boolean;
          completed_at: string | null;
          completed_year: string | null;
          created_at: string;
          updated_at: string;
        };
      };

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
      project_category: "doors" | "furniture" | "windows";
      project_status: "public" | "nda" | "concept";
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
      inquiry_channel: "web_form" | "ai_chat" | "phone" | "direct" | "referral";
      chat_role: "user" | "assistant";
      product_type: "door" | "furniture" | "window";
      blog_comment_status: "pending" | "approved" | "rejected";
      email_subscriber_status: "subscribed" | "unsubscribed" | "bounced" | "complained";
      email_campaign_status: "draft" | "scheduled" | "sending" | "sent" | "failed";
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
      order_notification_type: "status_changed" | "photo_added" | "message_received" | "order_ready";
      price_preset_category: "material" | "consumable" | "labor" | "overhead";
      pricing_product_type: "door" | "furniture" | "window" | "restoration";
      formula_component_type: "material" | "consumable" | "labor" | "overhead" | "tax" | "margin";
      invoice_status: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
      payment_method: "cash" | "bank_transfer" | "card" | "other";
      support_channel: "internal" | "email" | "viber" | "whatsapp";
      support_chat_status: "open" | "waiting" | "resolved" | "closed";
      support_message_sender: "client" | "admin" | "system";
      project_privacy_level: "public" | "nda_partial" | "nda_full";
      audit_actor_type: "admin" | "client" | "system" | "anonymous";
      audit_action: "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
    };
    CompositeTypes: Record<string, never>;
  };
}

