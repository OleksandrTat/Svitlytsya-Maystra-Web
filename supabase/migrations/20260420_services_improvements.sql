-- ─────────────────────────────────────────────────────────────────────────────
-- Services table improvements
-- 1. EN columns for features & process_steps (full i18n support)
-- 2. CHECK constraints on price_from and duration
-- 3. auto-update trigger for updated_at
-- 4. index on (is_active, sort_order) for list queries
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. EN translation columns for structured JSONB fields
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS features_en      jsonb,
  ADD COLUMN IF NOT EXISTS process_steps_en jsonb;

-- 2. CHECK constraints
ALTER TABLE public.services
  ADD CONSTRAINT services_price_from_non_negative
    CHECK (price_from IS NULL OR price_from >= 0);

ALTER TABLE public.services
  ADD CONSTRAINT services_duration_days_positive
    CHECK (
      (duration_days_from IS NULL OR duration_days_from > 0) AND
      (duration_days_to   IS NULL OR duration_days_to   > 0)
    );

ALTER TABLE public.services
  ADD CONSTRAINT services_duration_days_order
    CHECK (
      duration_days_from IS NULL OR
      duration_days_to   IS NULL OR
      duration_days_from <= duration_days_to
    );

-- 3. auto-update updated_at trigger
CREATE OR REPLACE FUNCTION touch_services_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS services_updated_at ON public.services;

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION touch_services_updated_at();

-- 4. composite index for the most common list query
--    SELECT * FROM services WHERE is_active = true ORDER BY sort_order
CREATE INDEX IF NOT EXISTS services_active_sort_idx
  ON public.services (is_active, sort_order);
