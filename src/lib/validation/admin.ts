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
  is_featured: z.boolean().default(false),
  cover_image: z.string().url(),
  images: z.string().default(""),
});

export const serviceFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  slug: z.string().min(3),
  short_description: z.string().min(10),
  description: z.string().min(20),
  process_steps: z.string().default(""),
  cover_image: z.string().url(),
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

