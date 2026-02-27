import type {
  InquiryStatus,
  OrderPriority,
  OrderStatus,
  ProjectCategory,
  ProjectPrivacyLevel,
  ProjectStatus,
} from "@/lib/types";

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  doors: "Двері",
  furniture: "Меблі",
  windows: "Вікна",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  public: "Публічний",
  nda: "Під NDA",
  concept: "Концепт",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "Нова",
  in_progress: "В роботі",
  done: "Виконано",
  archived: "Архів",
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
