import type {
  InquiryStatus,
  OrderPriority,
  OrderStatus,
  ProjectCategory,
  ProjectPrivacyLevel,
  ProjectStatus,
  ProductStatus,
} from "@/lib/types";

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  doors: "Двері",
  furniture: "Меблі",
  windows: "Вікна",
};

export const PRODUCT_CATEGORY_LABELS: Record<
  "doors" | "furniture" | "windows" | "restoration",
  string
> = {
  doors: "Двері",
  furniture: "Меблі",
  windows: "Вікна",
  restoration: "Реставрація",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  public: "Публічний",
  nda: "Під NDA",
  concept: "Концепт",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Активний",
  draft: "Чернетка",
  archived: "Архів",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "Нова",
  contacted: "Зв'язались",
  quoted: "Розрахунок надіслано",
  won: "Виграно",
  lost: "Програно",
  in_progress: "В роботі",
  done: "Виконано",
  archived: "Архів",
};

export const INQUIRY_STATUS_COLORS: Record<InquiryStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-sky-100 text-sky-800",
  quoted: "bg-violet-100 text-violet-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
  archived: "bg-zinc-100 text-zinc-600",
};

export const SERVICE_TYPES = ["Двері", "Меблі", "Вікна", "Реставрація", "Інше"] as const;

export const CATALOG_STYLES = ["класика", "мінімалізм", "лофт", "скандинавський", "модерн"] as const;

export const CATALOG_MATERIALS = ["дуб", "ясен", "сосна", "метал", "ПВХ", "скло"] as const;

export const PROJECT_PRIVACY_LEVEL_LABELS: Record<ProjectPrivacyLevel, string> = {
  public: "Public",
  nda_partial: "NDA Partial",
  nda_full: "NDA Full",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Заявку отримано",
  consulting: "Консультація",
  design: "Розробка дизайну",
  approved: "Дизайн узгоджено",
  production: "У виробництві",
  ready: "Готово до монтажу",
  installation: "Монтаж",
  completed: "Завершено",
  archived: "Архів",
};

export const ORDER_PRIORITY_LABELS: Record<OrderPriority, string> = {
  normal: "Звичайний",
  urgent: "Терміновий",
};
