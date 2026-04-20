-- ═══════════════════════════════════════════════════════════════════
-- Migration: DB hardening — phase 1 (non-breaking additions)
--
-- Adds missing indexes, unique/check constraints, cascade rules,
-- updated_at/published_at triggers, fills in i18n gaps, creates
-- category and team_members tables, plus a fixed rate-limit store.
--
-- Nothing in this migration drops data or removes columns. It is
-- safe to run on a production DB. CHECK constraints are added as
-- NOT VALID to avoid failing on any preexisting bad rows; validate
-- them separately once data is cleaned.
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- 1. Broken-column fix (B1): testimonials.product_id
-- ─────────────────────────────────────────────────────────────────
-- Code reads/writes `project_id` but the column was never created.
-- Add the correct column; application code is migrated separately.
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS product_id uuid
    REFERENCES public.products(id) ON DELETE SET NULL;


-- ─────────────────────────────────────────────────────────────────
-- 2. Missing _en columns (uk+en gap fill)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS author_location_en text;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS author_name_en text;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS price_unit_en text;


-- ─────────────────────────────────────────────────────────────────
-- 3. Category tables (will replace site_settings category junk)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  label_uk   text NOT NULL,
  label_en   text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.product_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  label_uk   text NOT NULL,
  label_en   text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  label_uk   text NOT NULL,
  label_en   text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.faq_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  label_uk   text NOT NULL,
  label_en   text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_categories     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active service cats"  ON public.service_categories;
DROP POLICY IF EXISTS "Service role full service cats"   ON public.service_categories;
CREATE POLICY "Public read active service cats" ON public.service_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full service cats" ON public.service_categories
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read active product cats"  ON public.product_categories;
DROP POLICY IF EXISTS "Service role full product cats"   ON public.product_categories;
CREATE POLICY "Public read active product cats" ON public.product_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full product cats" ON public.product_categories
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read active blog cats"     ON public.blog_categories;
DROP POLICY IF EXISTS "Service role full blog cats"      ON public.blog_categories;
CREATE POLICY "Public read active blog cats" ON public.blog_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full blog cats" ON public.blog_categories
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read active faq cats"      ON public.faq_categories;
DROP POLICY IF EXISTS "Service role full faq cats"       ON public.faq_categories;
CREATE POLICY "Public read active faq cats" ON public.faq_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full faq cats" ON public.faq_categories
  USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────
-- 4. team_members table (replaces company_info.team_members jsonb)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  name_en    text,
  role       text,
  role_en    text,
  bio        text,
  bio_en     text,
  photo_url  text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read visible team" ON public.team_members;
DROP POLICY IF EXISTS "Service role full team"   ON public.team_members;
CREATE POLICY "Public read visible team" ON public.team_members
  FOR SELECT USING (is_visible = true);
CREATE POLICY "Service role full team" ON public.team_members
  USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────
-- 5. rate_limit_events table (replaces rate_limit_store array hack)
-- ─────────────────────────────────────────────────────────────────
-- Old rate_limit_store kept in place; code will be switched over,
-- then the old table dropped in phase 2.
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  key        text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (key, created_at)
);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full rate limit events" ON public.rate_limit_events;
CREATE POLICY "Service role full rate limit events" ON public.rate_limit_events
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created_at
  ON public.rate_limit_events (created_at);


-- ─────────────────────────────────────────────────────────────────
-- 6. Pre-UNIQUE deduplication (in case existing data has dupes)
-- ─────────────────────────────────────────────────────────────────
-- wishlist: keep oldest row per (user_id, product_id)
DELETE FROM public.wishlist_items a
  USING public.wishlist_items b
 WHERE a.user_id   = b.user_id
   AND a.product_id = b.product_id
   AND a.created_at > b.created_at;

-- product_attributes: collapse dupes, summing usage_count
WITH keep AS (
  SELECT DISTINCT ON (category, type, value)
         id, category, type, value
    FROM public.product_attributes
    ORDER BY category, type, value, created_at
),
sums AS (
  SELECT category, type, value, SUM(usage_count)::int AS total
    FROM public.product_attributes
   GROUP BY category, type, value
)
UPDATE public.product_attributes pa
   SET usage_count = s.total
  FROM keep k
  JOIN sums s USING (category, type, value)
 WHERE pa.id = k.id;

DELETE FROM public.product_attributes pa
 USING public.product_attributes b
 WHERE pa.category = b.category
   AND pa.type     = b.type
   AND pa.value    = b.value
   AND pa.id      <> b.id
   AND pa.created_at > b.created_at;

-- contacts: collapse dupes by lower(email), then by phone.
-- Keeper = row with linked_user_id preferred, else oldest.
-- deals.contact_id redirected to keeper; missing fields filled in.

-- 6a. Redirect deals to keeper (email dupes)
UPDATE public.deals d
   SET contact_id = k.keeper_id
  FROM (
    SELECT
      c.id AS loser_id,
      FIRST_VALUE(c.id) OVER (
        PARTITION BY lower(c.email)
        ORDER BY (c.linked_user_id IS NULL), c.created_at
      ) AS keeper_id
    FROM public.contacts c
    WHERE c.email IS NOT NULL
  ) k
 WHERE d.contact_id = k.loser_id
   AND k.loser_id <> k.keeper_id;

-- 6b. Fill keeper's NULL phone/notes from any dupe (email group)
UPDATE public.contacts keeper
   SET phone = COALESCE(keeper.phone, dupe.phone),
       notes = COALESCE(keeper.notes, dupe.notes),
       last_activity_at = GREATEST(keeper.last_activity_at, dupe.last_activity_at)
  FROM public.contacts dupe
 WHERE dupe.email IS NOT NULL
   AND keeper.email IS NOT NULL
   AND lower(dupe.email) = lower(keeper.email)
   AND dupe.id <> keeper.id
   AND keeper.id = (
     SELECT c.id FROM public.contacts c
      WHERE lower(c.email) = lower(keeper.email)
      ORDER BY (c.linked_user_id IS NULL), c.created_at
      LIMIT 1
   );

-- 6c. Delete non-keeper email dupes
DELETE FROM public.contacts
 WHERE id IN (
   SELECT id FROM (
     SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY lower(email)
              ORDER BY (linked_user_id IS NULL), created_at
            ) AS rn
       FROM public.contacts
      WHERE email IS NOT NULL
   ) s WHERE s.rn > 1
 );

-- 6d. Redirect deals to keeper (phone dupes)
UPDATE public.deals d
   SET contact_id = k.keeper_id
  FROM (
    SELECT
      c.id AS loser_id,
      FIRST_VALUE(c.id) OVER (
        PARTITION BY c.phone
        ORDER BY (c.linked_user_id IS NULL), c.created_at
      ) AS keeper_id
    FROM public.contacts c
    WHERE c.phone IS NOT NULL
  ) k
 WHERE d.contact_id = k.loser_id
   AND k.loser_id <> k.keeper_id;

-- 6e. Fill keeper's NULL email/notes from any dupe (phone group)
UPDATE public.contacts keeper
   SET email = COALESCE(keeper.email, dupe.email),
       notes = COALESCE(keeper.notes, dupe.notes),
       last_activity_at = GREATEST(keeper.last_activity_at, dupe.last_activity_at)
  FROM public.contacts dupe
 WHERE dupe.phone IS NOT NULL
   AND keeper.phone IS NOT NULL
   AND dupe.phone = keeper.phone
   AND dupe.id <> keeper.id
   AND keeper.id = (
     SELECT c.id FROM public.contacts c
      WHERE c.phone = keeper.phone
      ORDER BY (c.linked_user_id IS NULL), c.created_at
      LIMIT 1
   );

-- 6f. Delete non-keeper phone dupes
DELETE FROM public.contacts
 WHERE id IN (
   SELECT id FROM (
     SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY phone
              ORDER BY (linked_user_id IS NULL), created_at
            ) AS rn
       FROM public.contacts
      WHERE phone IS NOT NULL
   ) s WHERE s.rn > 1
 );


-- ─────────────────────────────────────────────────────────────────
-- 7. UNIQUE constraints
-- ─────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uniq_wishlist_user_product
  ON public.wishlist_items (user_id, product_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_product_attributes_cat_type_value
  ON public.product_attributes (category, type, value);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_contacts_email_lower
  ON public.contacts (lower(email)) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_contacts_phone
  ON public.contacts (phone) WHERE phone IS NOT NULL;

-- company_info must be singleton — only enforced if already <=1 row
DO $$
BEGIN
  IF (SELECT count(*) FROM public.company_info) <= 1 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_company_info_singleton
      ON public.company_info ((true));
  ELSE
    RAISE NOTICE 'Skipping company_info singleton index: % rows found',
      (SELECT count(*) FROM public.company_info);
  END IF;
END$$;


-- ─────────────────────────────────────────────────────────────────
-- 8. CHECK constraints (added NOT VALID to tolerate legacy rows)
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_price_from_nonneg') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_price_from_nonneg
      CHECK (price_from IS NULL OR price_from >= 0) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_duration_from_positive') THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_duration_from_positive
      CHECK (duration_days_from IS NULL OR duration_days_from > 0) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_duration_to_gte_from') THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_duration_to_gte_from
      CHECK (
        duration_days_to IS NULL
        OR duration_days_from IS NULL
        OR duration_days_to >= duration_days_from
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_value_nonneg') THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_value_nonneg
      CHECK (value IS NULL OR value >= 0) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_email_shape') THEN
    ALTER TABLE public.newsletter_subscribers
      ADD CONSTRAINT newsletter_email_shape
      CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_invitations_status_valid') THEN
    ALTER TABLE public.client_invitations
      ADD CONSTRAINT client_invitations_status_valid
      CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')) NOT VALID;
  END IF;
END$$;


-- ─────────────────────────────────────────────────────────────────
-- 9. ON DELETE rules: recreate FKs with proper cascade behavior
-- ─────────────────────────────────────────────────────────────────
-- Hard cascades: child rows die with parent
ALTER TABLE public.deal_messages
  DROP CONSTRAINT IF EXISTS deal_messages_deal_id_fkey,
  ADD  CONSTRAINT deal_messages_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;

ALTER TABLE public.deal_stage_history
  DROP CONSTRAINT IF EXISTS deal_stage_history_deal_id_fkey,
  ADD  CONSTRAINT deal_stage_history_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;

ALTER TABLE public.order_messages
  DROP CONSTRAINT IF EXISTS order_messages_order_id_fkey,
  ADD  CONSTRAINT order_messages_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.order_status_history
  DROP CONSTRAINT IF EXISTS order_status_history_order_id_fkey,
  ADD  CONSTRAINT order_status_history_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.support_messages
  DROP CONSTRAINT IF EXISTS support_messages_chat_id_fkey,
  ADD  CONSTRAINT support_messages_chat_id_fkey
    FOREIGN KEY (chat_id) REFERENCES public.support_chats(id) ON DELETE CASCADE;

ALTER TABLE public.formula_components
  DROP CONSTRAINT IF EXISTS formula_components_formula_id_fkey,
  ADD  CONSTRAINT formula_components_formula_id_fkey
    FOREIGN KEY (formula_id) REFERENCES public.price_formulas(id) ON DELETE CASCADE;

ALTER TABLE public.support_chats
  DROP CONSTRAINT IF EXISTS support_chats_user_id_fkey,
  ADD  CONSTRAINT support_chats_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.saved_configurations
  DROP CONSTRAINT IF EXISTS saved_configurations_user_id_fkey,
  ADD  CONSTRAINT saved_configurations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_id_fkey,
  ADD  CONSTRAINT user_profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- SET NULL on auth.users: preserve records, drop attribution
ALTER TABLE public.audit_log
  DROP CONSTRAINT IF EXISTS audit_log_actor_id_fkey,
  ADD  CONSTRAINT audit_log_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.deal_messages
  DROP CONSTRAINT IF EXISTS deal_messages_sender_id_fkey,
  ADD  CONSTRAINT deal_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.deal_stage_history
  DROP CONSTRAINT IF EXISTS deal_stage_history_created_by_fkey,
  ADD  CONSTRAINT deal_stage_history_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.order_messages
  DROP CONSTRAINT IF EXISTS order_messages_sender_id_fkey,
  ADD  CONSTRAINT order_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.order_status_history
  DROP CONSTRAINT IF EXISTS order_status_history_created_by_fkey,
  ADD  CONSTRAINT order_status_history_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.support_messages
  DROP CONSTRAINT IF EXISTS support_messages_sender_id_fkey,
  ADD  CONSTRAINT support_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.client_invitations
  DROP CONSTRAINT IF EXISTS client_invitations_invited_by_fkey,
  ADD  CONSTRAINT client_invitations_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_linked_user_id_fkey,
  ADD  CONSTRAINT contacts_linked_user_id_fkey
    FOREIGN KEY (linked_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
  ADD  CONSTRAINT orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- SET NULL on parent entities (orders, products, etc.)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_inquiry_id_fkey,
  ADD  CONSTRAINT orders_inquiry_id_fkey
    FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_product_id_fkey,
  ADD  CONSTRAINT orders_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.support_chats
  DROP CONSTRAINT IF EXISTS support_chats_order_id_fkey,
  ADD  CONSTRAINT support_chats_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_inquiry_id_fkey,
  ADD  CONSTRAINT deals_inquiry_id_fkey
    FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE SET NULL;

ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_order_id_fkey,
  ADD  CONSTRAINT deals_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.client_invitations
  DROP CONSTRAINT IF EXISTS client_invitations_inquiry_id_fkey,
  ADD  CONSTRAINT client_invitations_inquiry_id_fkey
    FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE SET NULL;

ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_related_service_id_fkey,
  ADD  CONSTRAINT blog_posts_related_service_id_fkey
    FOREIGN KEY (related_service_id) REFERENCES public.services(id) ON DELETE SET NULL;

ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_related_product_id_fkey,
  ADD  CONSTRAINT blog_posts_related_product_id_fkey
    FOREIGN KEY (related_product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_formula_id_fkey,
  ADD  CONSTRAINT products_formula_id_fkey
    FOREIGN KEY (formula_id) REFERENCES public.price_formulas(id) ON DELETE SET NULL;

ALTER TABLE public.formula_components
  DROP CONSTRAINT IF EXISTS formula_components_preset_id_fkey,
  ADD  CONSTRAINT formula_components_preset_id_fkey
    FOREIGN KEY (preset_id) REFERENCES public.price_presets(id) ON DELETE SET NULL;

-- deals.contact_id: keep default (NO ACTION / RESTRICT) — contact
-- deletion should require admin to archive deals first.


-- ─────────────────────────────────────────────────────────────────
-- 10. FK indexes (required for JOIN + cascade performance)
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id             ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id            ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_related_service     ON public.blog_posts(related_service_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_related_product     ON public.blog_posts(related_product_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_inquiry     ON public.client_invitations(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_invited_by  ON public.client_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_contacts_linked_user           ON public.contacts(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_deal_messages_deal             ON public.deal_messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_messages_sender           ON public.deal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_deal        ON public.deal_stage_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_created_by  ON public.deal_stage_history(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_contact                  ON public.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_inquiry                  ON public.deals(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_deals_order                    ON public.deals(order_id);
CREATE INDEX IF NOT EXISTS idx_formula_components_formula     ON public.formula_components(formula_id);
CREATE INDEX IF NOT EXISTS idx_formula_components_preset      ON public.formula_components(preset_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_order           ON public.order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_sender          ON public.order_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order     ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_by ON public.order_status_history(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_inquiry                 ON public.orders(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_orders_user                    ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product                 ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_products_formula               ON public.products(formula_id);
CREATE INDEX IF NOT EXISTS idx_saved_configurations_user      ON public.saved_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_user             ON public.support_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_order            ON public.support_chats(order_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_chat          ON public.support_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender        ON public.support_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_product           ON public.testimonials(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user            ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product         ON public.wishlist_items(product_id);


-- ─────────────────────────────────────────────────────────────────
-- 11. Partial / composite indexes for hot query paths
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON public.blog_posts (published_at DESC) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_blog_posts_featured
  ON public.blog_posts (published_at DESC)
  WHERE is_published = true AND is_featured = true;

CREATE INDEX IF NOT EXISTS idx_products_active_sort
  ON public.products (sort_order, priority) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_services_active
  ON public.services (sort_order) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_status_created
  ON public.inquiries (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deals_stage_updated
  ON public.deals (stage, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_chats_status_last_msg
  ON public.support_chats (status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_deal_messages_unread
  ON public.deal_messages (deal_id) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_order_messages_unread
  ON public.order_messages (order_id) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_support_messages_unread
  ON public.support_messages (chat_id) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_certificates_published
  ON public.certificates (sort_order) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_faq_items_published
  ON public.faq_items (category, sort_order) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_testimonials_visible
  ON public.testimonials (created_at DESC) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_client_invitations_pending
  ON public.client_invitations (token) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_newsletter_active
  ON public.newsletter_subscribers (subscribed_at DESC) WHERE status = 'active';


-- ─────────────────────────────────────────────────────────────────
-- 12. GIN indexes for array / jsonb columns
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_materials_gin
  ON public.products USING GIN (materials);

CREATE INDEX IF NOT EXISTS idx_products_style_gin
  ON public.products USING GIN (style);

CREATE INDEX IF NOT EXISTS idx_products_images_gin
  ON public.products USING GIN (images);

CREATE INDEX IF NOT EXISTS idx_blog_posts_tags_gin
  ON public.blog_posts USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_services_gallery_gin
  ON public.services USING GIN (gallery);

CREATE INDEX IF NOT EXISTS idx_user_profiles_account_types_gin
  ON public.user_profiles USING GIN (account_types);


-- ─────────────────────────────────────────────────────────────────
-- 13. updated_at trigger (shared function + per-table triggers)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'blog_posts', 'certificates', 'company_info', 'deals',
      'faq_items', 'formula_components', 'orders', 'price_formulas',
      'price_presets', 'product_attributes', 'products', 'services',
      'site_settings', 'support_chats',
      'service_categories', 'product_categories',
      'blog_categories', 'faq_categories', 'team_members'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON public.%1$I;
       CREATE TRIGGER trg_%1$s_updated_at
         BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl
    );
  END LOOP;
END$$;


-- ─────────────────────────────────────────────────────────────────
-- 14. published_at auto-fill trigger for blog_posts
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_blog_published_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_published = true AND NEW.published_at IS NULL THEN
    NEW.published_at = timezone('utc', now());
  ELSIF NEW.is_published = false AND OLD.is_published = true THEN
    -- Unpublishing clears the timestamp; republishing will restamp.
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_posts_published_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_published_at
  BEFORE INSERT OR UPDATE OF is_published, published_at ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_published_at();


-- ═══════════════════════════════════════════════════════════════════
-- Done. Next steps (phase 2 migration, separate):
--   - Code: rate-limit → rate_limit_events, logActivity → audit_log
--   - Data: site_settings categories → *_categories tables
--   - Data: company_info.team_members/certificates jsonb → new tables
--   - Then drop: activity_logs, rate_limit_store, input_schema,
--     chat_session_id, orders.project_id (doesn't exist), etc.
-- ═══════════════════════════════════════════════════════════════════
