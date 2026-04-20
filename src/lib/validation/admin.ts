import { z } from "zod";

export const serviceFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  slug: z.string().min(3),
  tagline: z.string().default(""),
  short_description: z.string().min(10),
  description: z.string().min(20),
  icon: z.string().default(""),
  category: z.string().default(""),
  features: z.string().default("[]"),
  process_steps: z.string().default(""),
  cover_image: z.union([z.string().url(), z.literal("")]).default(""),
  price_from: z.coerce.number().min(0).optional(),
  price_unit: z.string().default("???"),
  duration_days_from: z.coerce.number().int().min(1).optional(),
  duration_days_to: z.coerce.number().int().min(1).optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  sort_order: z.coerce.number().int().min(0),
  title_en: z.string().optional(),
  tagline_en: z.string().optional(),
  short_description_en: z.string().optional(),
  description_en: z.string().optional(),
  seo_title_en: z.string().optional(),
  seo_description_en: z.string().optional(),
  features_en: z.string().optional(),
  process_steps_en: z.string().optional(),
});

export const testimonialFormSchema = z.object({
  id: z.string().uuid().optional(),
  author_name: z.string().min(2),
  author_location: z.string().optional(),
  content: z.string().min(10),
  rating: z.coerce.number().int().min(1).max(5),
  project_id: z.string().uuid().optional(),
  is_visible: z.boolean().default(true),
});

export const settingFormSchema = z.object({
  key: z.string().min(2),
  value: z.string().min(2),
  description: z.string().optional(),
});
