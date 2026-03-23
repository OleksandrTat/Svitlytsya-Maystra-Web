import type { OrderPriority } from "@/lib/types";

export type OrderTemplateDefaults = {
  inquiry_id?: string;
  user_id?: string;
  expected_date?: string;
  priority?: OrderPriority;
  internal_notes?: string;
};

export type OrderTemplate = {
  id: string;
  name: string;
  serviceType: string;
  defaults: OrderTemplateDefaults;
  basePrice: number | null;
  isActive: boolean;
};

export const DEFAULT_ORDER_TEMPLATES: OrderTemplate[] = [
  {
    id: "template-door-standard-oak",
    name: "Doors - Standard Oak",
    serviceType: "Двері",
    defaults: {
      priority: "normal",
      internal_notes: "Стандартні двері з дуба, типова комплектація.",
    },
    basePrice: null,
    isActive: true,
  },
  {
    id: "template-furniture-wardrobe",
    name: "Furniture - Wardrobe",
    serviceType: "Меблі",
    defaults: {
      priority: "normal",
      internal_notes: "Шафа за стандартним шаблоном.",
    },
    basePrice: null,
    isActive: true,
  },
  {
    id: "template-windows-fast-track",
    name: "Windows - Fast Track",
    serviceType: "Вікна",
    defaults: {
      priority: "urgent",
      internal_notes: "Термінове замовлення вікон. Узгодити дату монтажу.",
    },
    basePrice: null,
    isActive: true,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTemplateDefaults(value: unknown): OrderTemplateDefaults {
  if (!isRecord(value)) {
    return {};
  }

  const defaults: OrderTemplateDefaults = {};

  if (typeof value.inquiry_id === "string") {
    defaults.inquiry_id = value.inquiry_id;
  }
  if (typeof value.user_id === "string") {
    defaults.user_id = value.user_id;
  }
  if (typeof value.expected_date === "string") {
    defaults.expected_date = value.expected_date;
  }
  if (value.priority === "normal" || value.priority === "urgent") {
    defaults.priority = value.priority;
  }
  if (typeof value.internal_notes === "string") {
    defaults.internal_notes = value.internal_notes;
  }

  return defaults;
}

export function parseOrderTemplates(value: unknown): OrderTemplate[] {
  if (!Array.isArray(value)) {
    return DEFAULT_ORDER_TEMPLATES;
  }

  const templates = value
    .map((item, index): OrderTemplate | null => {
      if (!isRecord(item)) {
        return null;
      }

      if (typeof item.name !== "string" || typeof item.serviceType !== "string") {
        return null;
      }

      const id =
        typeof item.id === "string" && item.id.length > 0
          ? item.id
          : `template-${index + 1}`;

      return {
        id,
        name: item.name,
        serviceType: item.serviceType,
        defaults: parseTemplateDefaults(item.defaults),
        basePrice: typeof item.basePrice === "number" ? item.basePrice : null,
        isActive: item.isActive !== false,
      };
    })
    .filter((item): item is OrderTemplate => item !== null);

  return templates.length > 0 ? templates : DEFAULT_ORDER_TEMPLATES;
}
