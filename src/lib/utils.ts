import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatProjectDate(date: string | null) {
  if (!date) {
    return "Не вказано";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    year: "numeric",
    month: "long",
  }).format(new Date(date));
}

export function formatInquiryDate(date: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яіїєґ-]/g, "")
    .replace(/--+/g, "-");
}

