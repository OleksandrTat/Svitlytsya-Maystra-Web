import { z } from "zod";

export const projectFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(10),
  category: z.enum(["doors", "furniture", "windows"]),
  style: z.string().default(""),
  materials: z.string().default(""),
  dimensions: z.string().optional(),
  location: z.string().optional(),
  completed_at: z.string().optional(),
  duration_days: z.coerce.number().int().min(1).max(365).optional(),
  status: z.enum(["public", "nda", "concept"]),
  privacy_level: z.enum(["public", "nda_partial", "nda_full"]).default("public"),
  is_featured: z.boolean().default(false),
  cover_image: z.string().url(),
  images: z.string().default(""),
  blurred_images: z.string().default(""),
  private_client_name: z.string().optional(),
  private_location: z.string().optional(),
  private_notes: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

export const serviceFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  slug: z.string().min(3),
  tagline: z.string().default(""),
  short_description: z.string().min(10),
  description: z.string().min(20),
  icon: z.string().default(""),
  category: z.enum(["production", "consultation", "installation", "restoration"]).default("production"),
  features: z.string().default("[]"),
  process_steps: z.string().default(""),
  cover_image: z.union([z.string().url(), z.literal("")]).default(""),
  price_from: z.coerce.number().min(0).optional(),
  price_unit: z.string().default("грн"),
  duration_days_from: z.coerce.number().int().min(1).optional(),
  duration_days_to: z.coerce.number().int().min(1).optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  sort_order: z.coerce.number().int().min(0),
});

export const testimonialFormSchema = z.object({
  id: z.string().uuid().optional(),
  author_name: z.string().min(2),
  author_location: z.string().optional(),
  content: z.string().min(10),
  rating: z.coerce.number().int().min(1).max(5),
  project_id: z.string().uuid().optional().or(z.literal("")),
  is_visible: z.boolean().default(true),
});

export const settingFormSchema = z.object({
  key: z.string().min(2),
  value: z.string().min(2),
  description: z.string().optional(),
});

