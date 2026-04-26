-- ═════════════════════════════════════════════════════════════════
-- Drop legacy triggers / functions that still reference the
-- long-dropped public.product_attributes table.
--
-- Context:
--   Phase 3 (20260422_db_hardening_phase_3.sql) executed
--   `DROP TABLE IF EXISTS public.product_attributes;`
--
--   PostgreSQL does NOT track textual references to tables inside
--   plpgsql function bodies as dependencies, so the table drop
--   succeeds even if a trigger function still contains
--   `INSERT INTO public.product_attributes ...`. The function stays
--   on disk but every time it fires (e.g. on INSERT/UPDATE on
--   public.products) it raises:
--
--     relation "public.product_attributes" does not exist
--
--   That's exactly the error the admin UI hit when saving a product.
--
-- What this migration does:
--   1. Drops every trigger on public.* whose function body
--      references `product_attributes` (pre-phase-3 tracking
--      triggers such as track_product_attributes_usage,
--      sync_product_attributes, etc.).
--   2. Drops the functions themselves once they're no longer
--      attached to any trigger.
--   3. Is idempotent — re-running it is a no-op.
--
-- Implementation notes:
--   • We match on `pg_proc.prosrc` (raw body text) instead of
--     `pg_get_functiondef(p.oid)` because the latter raises
--     `"<name>" is an aggregate function` if any aggregate exists
--     in the target schema, aborting the whole loop.
--   • We also filter `prokind = 'f'` so we only inspect regular
--     functions (not aggregates, window funcs, or procedures).
-- ═════════════════════════════════════════════════════════════════

-- 1. Drop any trigger whose function body still mentions
--    product_attributes.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname  AS trigger_name,
           c.relname AS table_name,
           n.nspname AS schema_name
      FROM pg_trigger  t
      JOIN pg_class    c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc     p ON p.oid = t.tgfoid
     WHERE NOT t.tgisinternal
       AND n.nspname  = 'public'
       AND p.prokind  = 'f'
       AND p.prosrc ILIKE '%product_attributes%'
  LOOP
    RAISE NOTICE 'Dropping legacy trigger %.% on %.%',
      r.schema_name, r.trigger_name, r.schema_name, r.table_name;
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I.%I',
      r.trigger_name, r.schema_name, r.table_name
    );
  END LOOP;
END $$;

-- 2. Drop any regular function in `public` whose body still
--    references product_attributes. CASCADE cleans up anything
--    that still depends on it (e.g. a stray trigger we missed).

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name,
           p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname  = 'public'
       AND p.prokind  = 'f'
       AND p.prosrc ILIKE '%product_attributes%'
  LOOP
    RAISE NOTICE 'Dropping legacy function %.%(%)',
      r.schema_name, r.function_name, r.args;
    EXECUTE format(
      'DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
      r.schema_name, r.function_name, r.args
    );
  END LOOP;
END $$;

-- 3. Sanity check — log (not error) anything that slipped through
--    so the migration still succeeds but the user sees it.

DO $$
DECLARE
  leftover_count int;
BEGIN
  SELECT count(*) INTO leftover_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname  = 'public'
     AND p.prokind  = 'f'
     AND p.prosrc ILIKE '%product_attributes%';

  IF leftover_count > 0 THEN
    RAISE NOTICE
      '% function(s) in public still reference product_attributes. Inspect manually.',
      leftover_count;
  ELSE
    RAISE NOTICE
      'OK: no public functions reference product_attributes.';
  END IF;
END $$;
