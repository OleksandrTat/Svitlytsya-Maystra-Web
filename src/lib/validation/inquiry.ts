import { z } from "zod";
import { SERVICE_TYPES } from "@/lib/constants";

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Вкажіть ім'я (мінімум 2 символи)."),
  phone: z
    .string()
    .trim()
    .regex(/^\+380\d{9}$/, "Телефон має бути у форматі +380XXXXXXXXX.")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Вкажіть коректний email.")
    .optional()
    .or(z.literal("")),
  service_type: z.enum(SERVICE_TYPES),
  message: z
    .string()
    .trim()
    .max(1000, "Повідомлення має бути до 1000 символів.")
    .optional()
    .or(z.literal("")),
  source_page: z.string().trim().optional(),
  project_ref_id: z.string().uuid().optional().or(z.literal("")),
  configuration: z.string().optional().or(z.literal("")),
  honeypot: z.string().optional(),
  turnstile_token: z.string().optional(),
}).refine(
  (data) => Boolean(data.phone?.trim()) || Boolean(data.email?.trim()),
  {
    message: "Вкажіть телефон або email для зв'язку.",
    path: ["phone"],
  },
);

export type InquirySchema = z.infer<typeof inquirySchema>;
