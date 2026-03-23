import { z } from "zod";
import { SERVICE_TYPES } from "@/lib/constants";

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Р’РєР°Р¶С–С‚СЊ С–Рј'СЏ (РјС–РЅС–РјСѓРј 2 СЃРёРјРІРѕР»Рё)."),
  phone: z
    .string()
    .trim()
    .regex(/^\+380\d{9}$/, "РўРµР»РµС„РѕРЅ РјР°С” Р±СѓС‚Рё Сѓ С„РѕСЂРјР°С‚С– +380XXXXXXXXX.")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Р’РєР°Р¶С–С‚СЊ РєРѕСЂРµРєС‚РЅРёР№ email.")
    .optional()
    .or(z.literal("")),
  service_type: z.enum(SERVICE_TYPES),
  message: z
    .string()
    .trim()
    .max(1000, "РџРѕРІС–РґРѕРјР»РµРЅРЅСЏ РјР°С” Р±СѓС‚Рё РґРѕ 1000 СЃРёРјРІРѕР»С–РІ.")
    .optional()
    .or(z.literal("")),
  source_page: z.string().trim().optional(),
  configuration: z.string().optional().or(z.literal("")),
  honeypot: z.string().optional(),
  turnstile_token: z.string().optional(),
}).refine(
  (data) => Boolean(data.phone?.trim()) || Boolean(data.email?.trim()),
  {
    message: "Р’РєР°Р¶С–С‚СЊ С‚РµР»РµС„РѕРЅ Р°Р±Рѕ email РґР»СЏ Р·РІ'СЏР·РєСѓ.",
    path: ["phone"],
  },
);

export type InquirySchema = z.infer<typeof inquirySchema>;
