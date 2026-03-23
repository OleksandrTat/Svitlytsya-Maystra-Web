-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_type USER-DEFINED NOT NULL DEFAULT 'system'::audit_actor_type,
  action USER-DEFINED NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id)
);
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL,
  content text NOT NULL,
  cover_image text,
  category text NOT NULL,
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  reading_time_min integer NOT NULL DEFAULT 1 CHECK (reading_time_min > 0),
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  seo_title text,
  seo_description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  author_name text NOT NULL DEFAULT 'Команда Світлиці'::text,
  author_avatar text,
  is_featured boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  related_service_id uuid,
  related_product_id uuid,
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_related_service_id_fkey FOREIGN KEY (related_service_id) REFERENCES public.services(id),
  CONSTRAINT blog_posts_related_product_id_fkey FOREIGN KEY (related_product_id) REFERENCES public.products(id)
);
CREATE TABLE public.client_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inquiry_id uuid,
  email text NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'::text) UNIQUE,
  status text NOT NULL DEFAULT 'pending'::text,
  invited_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone NOT NULL DEFAULT (timezone('utc'::text, now()) + '7 days'::interval),
  accepted_at timestamp with time zone,
  CONSTRAINT client_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT client_invitations_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id),
  CONSTRAINT client_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id)
);
CREATE TABLE public.company_info (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Світлиця Майстра'::text,
  tagline text,
  description text,
  founded_year integer,
  email text,
  phone text,
  phone_secondary text,
  address text,
  city text DEFAULT 'Київ'::text,
  country text DEFAULT 'Україна'::text,
  working_hours text DEFAULT 'Пн-Пт 9:00-18:00'::text,
  logo_url text,
  og_image_url text,
  social_facebook text,
  social_instagram text,
  social_youtube text,
  social_tiktok text,
  team_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  certificates jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT company_info_pkey PRIMARY KEY (id)
);
CREATE TABLE public.formula_components (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  formula_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  label text NOT NULL,
  preset_id uuid,
  expression text NOT NULL,
  condition text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  notes text,
  is_discount boolean NOT NULL DEFAULT false,
  CONSTRAINT formula_components_pkey PRIMARY KEY (id),
  CONSTRAINT formula_components_formula_id_fkey FOREIGN KEY (formula_id) REFERENCES public.price_formulas(id),
  CONSTRAINT formula_components_preset_id_fkey FOREIGN KEY (preset_id) REFERENCES public.price_presets(id)
);
CREATE TABLE public.inquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  service_type text NOT NULL,
  message text,
  source_page text,
  status USER-DEFINED NOT NULL DEFAULT 'new'::inquiry_status,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  configuration jsonb,
  chat_session_id uuid,
  channel USER-DEFINED NOT NULL DEFAULT 'web_form'::inquiry_channel,
  CONSTRAINT inquiries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_calculations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  formula_id uuid NOT NULL,
  input_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL CHECK (total >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_calculations_pkey PRIMARY KEY (id),
  CONSTRAINT order_calculations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_calculations_formula_id_fkey FOREIGN KEY (formula_id) REFERENCES public.price_formulas(id)
);
CREATE TABLE public.order_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  file_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_documents_pkey PRIMARY KEY (id),
  CONSTRAINT order_documents_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.order_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  sender_type USER-DEFINED NOT NULL,
  sender_id uuid,
  content text NOT NULL,
  attachment_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_messages_pkey PRIMARY KEY (id),
  CONSTRAINT order_messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.order_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  stage USER-DEFINED NOT NULL DEFAULT 'production'::order_status,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_photos_pkey PRIMARY KEY (id),
  CONSTRAINT order_photos_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  from_status USER-DEFINED,
  to_status USER-DEFINED NOT NULL,
  comment text,
  is_visible_to_client boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_status_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL DEFAULT generate_order_number() UNIQUE,
  inquiry_id uuid,
  user_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'new'::order_status,
  expected_date date,
  actual_date date,
  internal_notes text,
  priority USER-DEFINED NOT NULL DEFAULT 'normal'::order_priority,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  product_id uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.price_formulas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  product_type USER-DEFINED NOT NULL,
  description text,
  input_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  user_inputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT price_formulas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.price_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category USER-DEFINED NOT NULL,
  unit text NOT NULL,
  value numeric NOT NULL CHECK (value >= 0::numeric),
  currency text NOT NULL DEFAULT 'UAH'::text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  variable_key text NOT NULL,
  CONSTRAINT price_presets_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_attributes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['style'::text, 'material'::text])),
  value text NOT NULL,
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT product_attributes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_type USER-DEFINED NOT NULL,
  configuration_key text NOT NULL UNIQUE,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT product_configurations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  short_description text,
  category text NOT NULL,
  materials ARRAY NOT NULL DEFAULT '{}'::text[],
  style ARRAY NOT NULL DEFAULT '{}'::text[],
  cover_image text,
  images ARRAY NOT NULL DEFAULT '{}'::text[],
  price_from numeric,
  formula_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::product_status,
  sort_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  priority integer NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_formula_id_fkey FOREIGN KEY (formula_id) REFERENCES public.price_formulas(id)
);
CREATE TABLE public.rate_limit_store (
  key text NOT NULL,
  timestamps ARRAY NOT NULL DEFAULT '{}'::timestamp with time zone[],
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rate_limit_store_pkey PRIMARY KEY (key)
);
CREATE TABLE public.saved_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid,
  product_type USER-DEFINED NOT NULL,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT saved_configurations_pkey PRIMARY KEY (id),
  CONSTRAINT saved_configurations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text NOT NULL,
  description text NOT NULL,
  process_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_image text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tagline text,
  icon text,
  gallery ARRAY NOT NULL DEFAULT '{}'::text[],
  category text NOT NULL DEFAULT 'production'::text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_from numeric,
  price_unit text DEFAULT 'грн'::text,
  duration_days_from integer,
  duration_days_to integer,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE TABLE public.site_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.support_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid,
  subject text,
  channel USER-DEFINED NOT NULL DEFAULT 'internal'::support_channel,
  status USER-DEFINED NOT NULL DEFAULT 'open'::support_chat_status,
  preferred_contact text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  last_message_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at timestamp with time zone,
  CONSTRAINT support_chats_pkey PRIMARY KEY (id),
  CONSTRAINT support_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT support_chats_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.support_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  sender_type USER-DEFINED NOT NULL,
  sender_id uuid,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT support_messages_pkey PRIMARY KEY (id),
  CONSTRAINT support_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.support_chats(id),
  CONSTRAINT support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_location text,
  content text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT testimonials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  account_types ARRAY NOT NULL DEFAULT '{}'::text[],
  email_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);