-- ═════════════════════════════════════════════════════════════════
-- Phase 3 DB hardening — FK normalisation
--
-- Depends on: 20260421_db_hardening_phase_2.sql
--   (category tables already seeded, legacy columns/tables dropped)
--
-- Four independent parts:
--   A. Add inquiries.contact_id → contacts(id), backfill from email/phone
--   B. Normalise products.materials / products.style into lookup
--      tables + junction tables, kept in sync with the cache arrays
--      on products via triggers (arrays remain the write target for
--      existing admin code — triggers rebuild the junction).
--   C. Add FK constraints on services.category, products.category,
--      blog_posts.category, faq_items.category → *_categories(slug).
--      Pre-seed any missing slugs so the constraint can be added.
--   D. Drop now-unused site_settings keys and the product_attributes
--      table.
-- ═════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- PART A — inquiries.contact_id
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS contact_id uuid;

-- Match existing inquiries to contacts by normalised email, then by
-- normalised phone (digits only). Keep whichever contact was created
-- first when multiple match.
WITH matched AS (
  SELECT DISTINCT ON (i.id)
    i.id AS inquiry_id,
    c.id AS contact_id
  FROM public.inquiries i
  JOIN public.contacts c ON (
    (i.email IS NOT NULL AND c.email IS NOT NULL
       AND lower(trim(i.email)) = lower(trim(c.email)))
    OR
    (i.phone IS NOT NULL AND c.phone IS NOT NULL
       AND regexp_replace(i.phone, '\D', '', 'g') =
           regexp_replace(c.phone, '\D', '', 'g')
       AND regexp_replace(i.phone, '\D', '', 'g') <> '')
  )
  WHERE i.contact_id IS NULL
  ORDER BY i.id, c.created_at ASC
)
UPDATE public.inquiries i
SET contact_id = m.contact_id
FROM matched m
WHERE i.id = m.inquiry_id;

-- For unmatched inquiries, materialise a contact so contact_id is
-- never NULL. This keeps every historical inquiry linkable in the CRM.
WITH new_contacts AS (
  INSERT INTO public.contacts (name, phone, email, source, notes)
  SELECT
    COALESCE(NULLIF(trim(i.name), ''), 'Unknown'),
    NULLIF(trim(i.phone), ''),
    NULLIF(trim(i.email), ''),
    COALESCE(i.channel::text, 'manual'),
    'Auto-created from inquiry ' || i.id::text
  FROM public.inquiries i
  WHERE i.contact_id IS NULL
  RETURNING id, notes
)
UPDATE public.inquiries i
SET contact_id = nc.id
FROM new_contacts nc
WHERE nc.notes = 'Auto-created from inquiry ' || i.id::text
  AND i.contact_id IS NULL;

ALTER TABLE public.inquiries
  DROP CONSTRAINT IF EXISTS inquiries_contact_id_fkey;

ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS inquiries_contact_id_idx
  ON public.inquiries (contact_id);

-- ─────────────────────────────────────────────────────────────────
-- PART B — materials / styles lookup + junctions
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.materials (
  slug       text PRIMARY KEY,
  label_uk   text NOT NULL,
  label_en   text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.styles (
  slug       text PRIMARY KEY,
  label_uk   text NOT NULL,
  label_en   text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.styles    ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materials' AND policyname = 'Public read materials') THEN
    CREATE POLICY "Public read materials" ON public.materials FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'materials' AND policyname = 'Admin write materials') THEN
    CREATE POLICY "Admin write materials" ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'styles' AND policyname = 'Public read styles') THEN
    CREATE POLICY "Public read styles" ON public.styles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'styles' AND policyname = 'Admin write styles') THEN
    CREATE POLICY "Admin write styles" ON public.styles FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed materials/styles lookup from:
--   1. distinct values in products.materials / products.style
--   2. site_settings.material_translations / style_translations (for label_en)
--   3. fallback product_attributes table if it still exists (type='material' or 'style')

DO $$
DECLARE
  material_translations jsonb;
  style_translations    jsonb;
BEGIN
  SELECT value INTO material_translations FROM public.site_settings WHERE key = 'material_translations';
  SELECT value INTO style_translations    FROM public.site_settings WHERE key = 'style_translations';

  -- Materials from product arrays
  INSERT INTO public.materials (slug, label_uk, label_en)
  SELECT DISTINCT
    m,
    m AS label_uk,
    CASE
      WHEN material_translations IS NOT NULL AND jsonb_typeof(material_translations) = 'object'
        THEN NULLIF(material_translations->>m, '')
      ELSE NULL
    END AS label_en
  FROM public.products, LATERAL unnest(COALESCE(materials, ARRAY[]::text[])) AS m
  WHERE m IS NOT NULL AND m <> ''
  ON CONFLICT (slug) DO NOTHING;

  -- Styles from product arrays
  INSERT INTO public.styles (slug, label_uk, label_en)
  SELECT DISTINCT
    s,
    s AS label_uk,
    CASE
      WHEN style_translations IS NOT NULL AND jsonb_typeof(style_translations) = 'object'
        THEN NULLIF(style_translations->>s, '')
      ELSE NULL
    END AS label_en
  FROM public.products, LATERAL unnest(COALESCE(style, ARRAY[]::text[])) AS s
  WHERE s IS NOT NULL AND s <> ''
  ON CONFLICT (slug) DO NOTHING;

  -- Extra values from product_attributes (if it still exists)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_attributes') THEN
    INSERT INTO public.materials (slug, label_uk, label_en)
    SELECT DISTINCT
      value,
      value,
      CASE
        WHEN material_translations IS NOT NULL AND jsonb_typeof(material_translations) = 'object'
          THEN NULLIF(material_translations->>value, '')
        ELSE NULL
      END
    FROM public.product_attributes
    WHERE type = 'material' AND value IS NOT NULL AND value <> ''
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO public.styles (slug, label_uk, label_en)
    SELECT DISTINCT
      value,
      value,
      CASE
        WHEN style_translations IS NOT NULL AND jsonb_typeof(style_translations) = 'object'
          THEN NULLIF(style_translations->>value, '')
        ELSE NULL
      END
    FROM public.product_attributes
    WHERE type = 'style' AND value IS NOT NULL AND value <> ''
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Junction tables
CREATE TABLE IF NOT EXISTS public.product_materials (
  product_id    uuid NOT NULL REFERENCES public.products(id)  ON DELETE CASCADE,
  material_slug text NOT NULL REFERENCES public.materials(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (product_id, material_slug)
);

CREATE TABLE IF NOT EXISTS public.product_styles (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  style_slug text NOT NULL REFERENCES public.styles(slug)  ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (product_id, style_slug)
);

CREATE INDEX IF NOT EXISTS product_materials_material_idx ON public.product_materials (material_slug);
CREATE INDEX IF NOT EXISTS product_styles_style_idx       ON public.product_styles (style_slug);

ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_styles    ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_materials' AND policyname = 'Public read product_materials') THEN
    CREATE POLICY "Public read product_materials" ON public.product_materials FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_materials' AND policyname = 'Admin write product_materials') THEN
    CREATE POLICY "Admin write product_materials" ON public.product_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_styles' AND policyname = 'Public read product_styles') THEN
    CREATE POLICY "Public read product_styles" ON public.product_styles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_styles' AND policyname = 'Admin write product_styles') THEN
    CREATE POLICY "Admin write product_styles" ON public.product_styles FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Trigger function: keep product_materials / product_styles junction in
-- sync with the cache arrays on products. Auto-seeds missing lookup rows
-- so the admin form never has to worry about it.

CREATE OR REPLACE FUNCTION public.sync_product_material_junction()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Auto-seed missing material slugs
  INSERT INTO public.materials (slug, label_uk)
  SELECT DISTINCT m, m
  FROM unnest(COALESCE(NEW.materials, ARRAY[]::text[])) AS m
  WHERE m IS NOT NULL AND m <> ''
  ON CONFLICT (slug) DO NOTHING;

  DELETE FROM public.product_materials
  WHERE product_id = NEW.id
    AND material_slug <> ALL(COALESCE(NEW.materials, ARRAY[]::text[]));

  INSERT INTO public.product_materials (product_id, material_slug)
  SELECT NEW.id, m
  FROM unnest(COALESCE(NEW.materials, ARRAY[]::text[])) AS m
  WHERE m IS NOT NULL AND m <> ''
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_product_style_junction()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.styles (slug, label_uk)
  SELECT DISTINCT s, s
  FROM unnest(COALESCE(NEW.style, ARRAY[]::text[])) AS s
  WHERE s IS NOT NULL AND s <> ''
  ON CONFLICT (slug) DO NOTHING;

  DELETE FROM public.product_styles
  WHERE product_id = NEW.id
    AND style_slug <> ALL(COALESCE(NEW.style, ARRAY[]::text[]));

  INSERT INTO public.product_styles (product_id, style_slug)
  SELECT NEW.id, s
  FROM unnest(COALESCE(NEW.style, ARRAY[]::text[])) AS s
  WHERE s IS NOT NULL AND s <> ''
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_sync_materials_junction ON public.products;
CREATE TRIGGER products_sync_materials_junction
  AFTER INSERT OR UPDATE OF materials ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_material_junction();

DROP TRIGGER IF EXISTS products_sync_styles_junction ON public.products;
CREATE TRIGGER products_sync_styles_junction
  AFTER INSERT OR UPDATE OF style ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_style_junction();

-- Populate junctions from existing products.materials / products.style
INSERT INTO public.product_materials (product_id, material_slug)
SELECT p.id, m
FROM public.products p, LATERAL unnest(COALESCE(p.materials, ARRAY[]::text[])) AS m
WHERE m IS NOT NULL AND m <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.product_styles (product_id, style_slug)
SELECT p.id, s
FROM public.products p, LATERAL unnest(COALESCE(p.style, ARRAY[]::text[])) AS s
WHERE s IS NOT NULL AND s <> ''
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- PART C — *.category FK constraints
-- ─────────────────────────────────────────────────────────────────

-- Pre-seed any category slug that exists on a row but is missing from
-- the corresponding lookup table. Without this the FK would fail.

INSERT INTO public.service_categories (slug, label_uk)
SELECT DISTINCT category, category
FROM public.services
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_categories (slug, label_uk)
SELECT DISTINCT category, category
FROM public.products
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.blog_categories (slug, label_uk)
SELECT DISTINCT category, category
FROM public.blog_posts
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.faq_categories (slug, label_uk)
SELECT DISTINCT category, category
FROM public.faq_items
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT (slug) DO NOTHING;

-- Add FK constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_category_fkey'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_category_fkey
      FOREIGN KEY (category) REFERENCES public.service_categories(slug)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_category_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_fkey
      FOREIGN KEY (category) REFERENCES public.product_categories(slug)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_category_fkey'
  ) THEN
    ALTER TABLE public.blog_posts
      ADD CONSTRAINT blog_posts_category_fkey
      FOREIGN KEY (category) REFERENCES public.blog_categories(slug)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'faq_items_category_fkey'
  ) THEN
    ALTER TABLE public.faq_items
      ADD CONSTRAINT faq_items_category_fkey
      FOREIGN KEY (category) REFERENCES public.faq_categories(slug)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS services_category_idx   ON public.services   (category);
CREATE INDEX IF NOT EXISTS products_category_idx   ON public.products   (category);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON public.blog_posts (category);
CREATE INDEX IF NOT EXISTS faq_items_category_idx  ON public.faq_items  (category);

-- ─────────────────────────────────────────────────────────────────
-- PART D — drops / cleanup
-- ─────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.product_attributes;

DELETE FROM public.site_settings
WHERE key IN (
  'service_category_labels',
  'product_category_labels',
  'blog_category_labels',
  'faq_category_labels',
  'faq_category_order',
  'style_translations',
  'material_translations',
  'blog_tag_translations'
);

-- ─────────────────────────────────────────────────────────────────
-- Post-migration notes
--   • Verify inquiries.contact_id is populated for every row.
--   • Verify product_materials / product_styles counts equal
--     sum(array_length(materials/style, 1)) over products.
--   • Trigger keeps products.materials/style arrays as the write path
--     for admin code; junctions are derived and read-only from the
--     app's point of view for now.
--   • Materials / styles lookup labels (label_uk/label_en) can now be
--     managed via a dedicated admin screen when we want richer i18n.
-- ═════════════════════════════════════════════════════════════════
