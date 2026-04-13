-- Add SEO fields to certificates table
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS seo_title       text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_title_en    text,
  ADD COLUMN IF NOT EXISTS seo_description_en text;
