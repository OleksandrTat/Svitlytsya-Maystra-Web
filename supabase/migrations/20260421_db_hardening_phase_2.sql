-- ═════════════════════════════════════════════════════════════════
-- Phase 2 DB hardening — data migrations and destructive drops
--
-- Depends on: 20260420_db_hardening_phase_1.sql (category tables,
-- team_members table, rate_limit_events table, audit_log).
--
-- What this does (idempotent where possible):
--   1. Seeds *_categories tables from site_settings keys
--   2. Migrates company_info.team_members jsonb → team_members rows
--   3. Migrates company_info.certificates jsonb → certificates rows
--   4. Adds client_invitations.token_hash, backfills via sha256,
--      makes it NOT NULL, drops plaintext token column
--   5. Drops orders.project_id, inquiries.chat_session_id,
--      price_formulas.input_schema
--   6. Drops company_info.team_members, company_info.certificates jsonb
--   7. Drops rate_limit_store and activity_logs tables
--
-- Pre-flight requirement: all application code must already be on the
-- new schema (audit_log writes, rate_limit_events, token_hash lookups).
-- ═════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────────
-- 1. Seed *_categories from site_settings
--    Shape: value is {"slug": {"uk": "Label", "en": "Label"}, ...}
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  labels_obj jsonb;
  order_arr  jsonb;
  slug_key   text;
  labels_val jsonb;
  idx        integer;
BEGIN
  -- service_categories
  SELECT value INTO labels_obj FROM public.site_settings WHERE key = 'service_category_labels';
  IF labels_obj IS NOT NULL AND jsonb_typeof(labels_obj) = 'object' THEN
    FOR slug_key, labels_val IN SELECT key, value FROM jsonb_each(labels_obj) LOOP
      INSERT INTO public.service_categories (slug, label_uk, label_en)
      VALUES (
        slug_key,
        COALESCE(NULLIF(labels_val->>'uk', ''), slug_key),
        NULLIF(labels_val->>'en', '')
      )
      ON CONFLICT (slug) DO NOTHING;
    END LOOP;
  END IF;

  -- product_categories
  SELECT value INTO labels_obj FROM public.site_settings WHERE key = 'product_category_labels';
  IF labels_obj IS NOT NULL AND jsonb_typeof(labels_obj) = 'object' THEN
    FOR slug_key, labels_val IN SELECT key, value FROM jsonb_each(labels_obj) LOOP
      INSERT INTO public.product_categories (slug, label_uk, label_en)
      VALUES (
        slug_key,
        COALESCE(NULLIF(labels_val->>'uk', ''), slug_key),
        NULLIF(labels_val->>'en', '')
      )
      ON CONFLICT (slug) DO NOTHING;
    END LOOP;
  END IF;

  -- blog_categories
  SELECT value INTO labels_obj FROM public.site_settings WHERE key = 'blog_category_labels';
  IF labels_obj IS NOT NULL AND jsonb_typeof(labels_obj) = 'object' THEN
    FOR slug_key, labels_val IN SELECT key, value FROM jsonb_each(labels_obj) LOOP
      INSERT INTO public.blog_categories (slug, label_uk, label_en)
      VALUES (
        slug_key,
        COALESCE(NULLIF(labels_val->>'uk', ''), slug_key),
        NULLIF(labels_val->>'en', '')
      )
      ON CONFLICT (slug) DO NOTHING;
    END LOOP;
  END IF;

  -- faq_categories (with sort_order derived from faq_category_order array)
  SELECT value INTO labels_obj FROM public.site_settings WHERE key = 'faq_category_labels';
  SELECT value INTO order_arr  FROM public.site_settings WHERE key = 'faq_category_order';
  IF labels_obj IS NOT NULL AND jsonb_typeof(labels_obj) = 'object' THEN
    FOR slug_key, labels_val IN SELECT key, value FROM jsonb_each(labels_obj) LOOP
      idx := 0;
      IF order_arr IS NOT NULL AND jsonb_typeof(order_arr) = 'array' THEN
        -- find position (1-based) of slug in the order array; 0 if absent
        SELECT COALESCE(MIN(pos), 0) INTO idx
        FROM jsonb_array_elements_text(order_arr) WITH ORDINALITY AS t(val, pos)
        WHERE t.val = slug_key;
      END IF;
      INSERT INTO public.faq_categories (slug, label_uk, label_en, sort_order)
      VALUES (
        slug_key,
        COALESCE(NULLIF(labels_val->>'uk', ''), slug_key),
        NULLIF(labels_val->>'en', ''),
        idx
      )
      ON CONFLICT (slug) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 2. Migrate company_info.team_members jsonb → team_members table
-- ─────────────────────────────────────────────────────────────────

INSERT INTO public.team_members (id, name, role, photo_url, sort_order, is_visible)
SELECT
  CASE
    WHEN (member->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (member->>'id')::uuid
    ELSE gen_random_uuid()
  END AS id,
  NULLIF(member->>'name', '')   AS name,
  NULLIF(member->>'role', '')   AS role,
  NULLIF(member->>'photo_url', '') AS photo_url,
  (ROW_NUMBER() OVER (ORDER BY 1))::int - 1 AS sort_order,
  true AS is_visible
FROM public.company_info
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(team_members) = 'array' THEN team_members ELSE '[]'::jsonb END
) AS member
WHERE NULLIF(member->>'name', '') IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 3. Migrate company_info.certificates jsonb → certificates table
--    Best-effort: only rows with title+issuer present. Duplicates (same
--    title+issuer) are skipped so this is safe to re-run.
-- ─────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS uniq_certificates_title_issuer
  ON public.certificates (title, issuer);

INSERT INTO public.certificates (id, title, issuer, issued_year, description, image_url, sort_order, is_published)
SELECT
  CASE
    WHEN (cert->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (cert->>'id')::uuid
    ELSE gen_random_uuid()
  END AS id,
  cert->>'title'   AS title,
  cert->>'issuer'  AS issuer,
  CASE WHEN cert->>'issued_year' ~ '^\d+$' THEN (cert->>'issued_year')::int ELSE NULL END AS issued_year,
  NULLIF(cert->>'description', '') AS description,
  NULLIF(cert->>'image_url', '')   AS image_url,
  (ROW_NUMBER() OVER (ORDER BY 1))::int - 1 AS sort_order,
  true AS is_published
FROM public.company_info
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(certificates) = 'array' THEN certificates ELSE '[]'::jsonb END
) AS cert
WHERE NULLIF(cert->>'title', '') IS NOT NULL
  AND NULLIF(cert->>'issuer', '') IS NOT NULL
ON CONFLICT (title, issuer) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 4. Invitation token hashing
--    Strategy: add token_hash column, backfill sha256(token),
--    enforce NOT NULL + unique, then drop plaintext token column.
--    Existing invite URLs keep working because the accept route
--    hashes the incoming token and looks it up by hash.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.client_invitations
  ADD COLUMN IF NOT EXISTS token_hash text;

UPDATE public.client_invitations
SET token_hash = encode(digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL AND token IS NOT NULL;

-- Any rows that somehow have no plaintext token left behind get a
-- sentinel hash that can't match any real sha256 (prevents NULL).
UPDATE public.client_invitations
SET token_hash = 'NULL_TOKEN_' || id::text
WHERE token_hash IS NULL;

ALTER TABLE public.client_invitations
  ALTER COLUMN token_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_client_invitations_token_hash
  ON public.client_invitations (token_hash);

-- Drop plaintext column (the unique index on it will fall with it)
ALTER TABLE public.client_invitations
  DROP COLUMN IF EXISTS token;

-- ─────────────────────────────────────────────────────────────────
-- 5. Drop dead columns
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.orders           DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.inquiries        DROP COLUMN IF EXISTS chat_session_id;
ALTER TABLE public.price_formulas   DROP COLUMN IF EXISTS input_schema;

-- ─────────────────────────────────────────────────────────────────
-- 6. Drop migrated-out jsonb columns from company_info
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.company_info DROP COLUMN IF EXISTS team_members;
ALTER TABLE public.company_info DROP COLUMN IF EXISTS certificates;

-- ─────────────────────────────────────────────────────────────────
-- 7. Drop replaced tables
-- ─────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.rate_limit_store;
DROP TABLE IF EXISTS public.activity_logs;

-- ─────────────────────────────────────────────────────────────────
-- Post-migration notes
--   • Verify row counts in service_categories / product_categories /
--     blog_categories / faq_categories match site_settings keys.
--   • Verify team_members / certificates populated from jsonb.
--   • site_settings keys service_category_labels / product_category_labels /
--     blog_category_labels / faq_category_labels / faq_category_order can
--     be deleted in a follow-up migration once the fallback is removed
--     from code.
-- ═════════════════════════════════════════════════════════════════
