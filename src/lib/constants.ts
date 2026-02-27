import type { InquiryStatus, ProjectCategory, ProjectStatus } from "@/lib/types";

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

export const SERVICE_TYPES = [
  "Двері",
  "Меблі",
  "Вікна",
  "Реставрація",
  "Інше",
] as const;

export const CATALOG_STYLES = [
  "класика",
  "мінімалізм",
  "лофт",
  "скандинавський",
  "модерн",
] as const;

export const CATALOG_MATERIALS = [
  "дуб",
  "ясен",
  "сосна",
  "метал",
  "ПВХ",
  "скло",
] as const;

